from django.db.models import Exists, OuterRef

from lynx.utils.singlefile import is_singlefile_enabled
from .decorators import async_login_required, lynx_post_only
from .widgets import FancyTextWidget, FancyDateWidget
from . import paginator, breadcrumbs
from asgiref.sync import sync_to_async
from django import forms
from django.contrib import messages
from django.http import HttpRequest, HttpResponse
from django.template.response import TemplateResponse
from django.utils import timezone
from lynx import url_parser, url_summarizer, html_cleaner, commands
from lynx.models import Link, LinkArchive, Note, Tag
from lynx.errors import NoAPIKeyInSettings, UrlParseError
from lynx.tag_manager import delete_tag_for_user, create_tag_for_user, add_tags_to_link, load_all_user_tags, remove_tags_from_link, set_tags_on_link
from lynx.utils import headers, search
from django.shortcuts import aget_object_or_404, aget_list_or_404, redirect
from django.forms.widgets import DateInput


class AddLinkForm(forms.Form):
  url = forms.URLField(label="",
                       max_length=2000,
                       widget=FancyTextWidget('Article URL'))
  pasted_content = forms.CharField(
      required=False,
      widget=forms.Textarea(
          attrs={
              'class':
              'block p-2.5 mb-4 w-full text-m bg-transparent border-0 border-2 border-base-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary max-h-20 focus:max-h-max'
          }))

  async def create_link(self, user) -> Link:
    if self.cleaned_data['pasted_content']:
      url, _ = await commands.get_or_create_link_with_content(
          self.cleaned_data['url'], self.cleaned_data['pasted_content'], user)
      return url
    else:
      url, _ = await commands.get_or_create_link(self.cleaned_data['url'],
                                                 user)
      return url


@async_login_required
async def add_link_view(request: HttpRequest) -> HttpResponse:
  if request.method == 'POST':
    form = AddLinkForm(request.POST)
    if form.is_valid():
      try:
        user = await request.auser()
        await headers.maybe_update_usersetting_headers(request, user)
        link = await form.create_link(user)
        return redirect('lynx:link_viewer', pk=link.pk)
      except UrlParseError as e:
        messages.error(request,
                       f'Unable to parse link. The error was: {e.http_error}')
  else:
    form = AddLinkForm()

  breadcrumb_data = breadcrumbs.generate_breadcrumb_context_data(
      [breadcrumbs.HOME, breadcrumbs.ADD_LINK])
  return TemplateResponse(request, 'lynx/add_link.html',
                          {'form': form} | breadcrumb_data)


@async_login_required
@lynx_post_only
async def link_actions_view(request: HttpRequest, pk: int) -> HttpResponse:
  user = await request.auser()
  await headers.maybe_update_usersetting_headers(request, user)
  link = await aget_object_or_404(Link, pk=pk, user=user)
  if 'action_delete' in request.POST:
    title = link.title
    await link.adelete()
    messages.info(request, f'Link "{title}" deleted.')
  elif 'action_toggle_unread' in request.POST:
    if link.last_viewed_at is None:
      link.last_viewed_at = timezone.now()
    else:
      link.last_viewed_at = None
    await link.asave()
  elif 'action_summarize' in request.POST:
    try:
      await url_summarizer.generate_and_persist_summary(link)
    except NoAPIKeyInSettings:
      messages.error(
          request,
          'You must have an OpenAI API key in your settings to summarize links.'
      )
  elif 'action_reload' in request.POST:
    # Don't use the command here because we want to directly fetch
    # the content rather than returning early because the link exists.
    new_link = await (sync_to_async(url_parser.parse_url)(link.original_url,
                                                          user))
    link.cleaned_url = new_link.cleaned_url
    link.hostname = new_link.hostname
    link.title = new_link.title
    link.article_date = new_link.article_date
    link.author = new_link.author
    link.excerpt = new_link.excerpt
    link.article_html = new_link.article_html
    link.raw_text_content = new_link.raw_text_content
    link.full_page_html = new_link.full_page_html
    link.header_image_url = new_link.header_image_url
    link.read_time_seconds = new_link.read_time_seconds
    link.read_time_display = new_link.read_time_display
    await link.asave()
  elif 'action_reparse' in request.POST:
    url_context = url_parser.UrlContext(link.original_url, user)
    reparsed = url_parser.parse_content(url_context, link.full_page_html)
    link.article_date = reparsed['article_date']
    link.author = reparsed['author']
    link.title = reparsed['title']
    link.excerpt = reparsed['excerpt']
    link.article_html = reparsed['article_html']
    link.raw_text_content = reparsed['raw_text_content']
    link.header_image_url = reparsed['header_image_url']
    link.read_time_seconds = reparsed['read_time_seconds']
    link.read_time_display = reparsed['read_time_display']
    await link.asave()
  else:
    messages.warning(request, 'Unable to perform unknown action')

  if 'next' in request.POST:
    return redirect(request.POST['next'])
  return redirect('lynx:links_feed')


@async_login_required
async def readable_view(request: HttpRequest, pk: int) -> HttpResponse:
  user = await request.auser()
  link = await aget_object_or_404(Link.objects_with_full_content.defer(
      'raw_text_content', 'full_page_html', 'content_search'),
                                  pk=pk,
                                  user=user)
  cleaner = html_cleaner.HTMLCleaner(link.article_html)
  cleaner.generate_headings().replace_image_links_with_images()
  tags_queryset = link.tags.all()
  tags = await (sync_to_async(list)(tags_queryset))
  all_user_tags = await (sync_to_async(list)(Tag.objects.filter(user=user)))
  context_data = {
      'link':
      link,
      'tags':
      tags,
      'all_user_tags':
      all_user_tags,
      'html_with_sections':
      cleaner.prettify(),
      'table_of_contents': [h.to_dict() for h in cleaner.get_headings()],
      'back_button_link':
      headers.get_lynx_referrer_or_default(request,
                                           exclude_route='links/<int:pk>/view')
  }

  link.last_viewed_at = timezone.now()
  await link.asave()
  return TemplateResponse(request, "lynx/link_viewer.html", context_data)


class EditDetailsForm(forms.Form):
  title = forms.CharField(label="",
                          max_length=200,
                          widget=FancyTextWidget('Title'))
  author = forms.CharField(label="",
                           max_length=200,
                           widget=FancyTextWidget('Author'))
  article_date = forms.DateField(label="",
                                 widget=FancyDateWidget('Article Date',
                                                        attrs={'type':
                                                               'date'}))


@async_login_required
async def details_view(request: HttpRequest, pk: int) -> HttpResponse:
  user = await request.auser()
  link = await aget_object_or_404(Link, pk=pk, user=user)
  if request.method == 'POST':
    form = EditDetailsForm(request.POST)
    if form.is_valid():
      await headers.maybe_update_usersetting_headers(request, user)
      link.title = form.cleaned_data['title']
      link.author = form.cleaned_data['author']
      link.article_date = form.cleaned_data['article_date']
      await link.asave()
      messages.success(request, 'Link details updated')

  else:
    form = EditDetailsForm(
        initial={
            'title': link.title,
            'author': link.author,
            'article_date': link.article_date
        })

  has_existing_archive = await LinkArchive.objects.filter(link=link).aexists()

  breadcrumb_data = breadcrumbs.generate_breadcrumb_context_data(
      [breadcrumbs.HOME, breadcrumbs.EDIT_LINK(link)])
  return TemplateResponse(request,
                          "lynx/link_details.html",
                          context={
                              'link': link,
                              'form': form,
                              'singlefile_enabled': is_singlefile_enabled(),
                              'has_existing_archive': has_existing_archive
                          } | breadcrumb_data)


@async_login_required
async def link_feed_view(request: HttpRequest,
                         filter: str = "all") -> HttpResponse:
  user = await request.auser()
  breadcrumbs_list: list[breadcrumbs.Breadcrumb] = [
      x for x in [breadcrumbs.HOME,
                  search.breadcrumb_for_links(request)] if x is not None
  ]
  # Filter to just links owned by this user, then the search
  # helper will do the rest.
  queryset, search_config = search.query_models(
      Link.objects.filter(user=user).annotate(
          has_archive=Exists(LinkArchive.objects.filter(link=OuterRef('pk')))),
      request)

  data = {}
  data['search_config'] = search_config

  paginator_data = await paginator.generate_paginator_context_data(
      request, queryset)
  tags = await load_all_user_tags(user)
  data['tags'] = tags
  data = data | paginator_data | breadcrumbs.generate_breadcrumb_context_data(
      breadcrumbs_list)
  return TemplateResponse(request, "lynx/links_feed.html", context=data)


@async_login_required
async def tagged_links_view(request: HttpRequest, slug: str) -> HttpResponse:
  user = await request.auser()
  tag = await aget_object_or_404(Tag, slug=slug, user=user)
  queryset = Link.objects.filter(user=user, tags=tag).annotate(
      has_archive=Exists(LinkArchive.objects.filter(link=OuterRef('pk'))))
  data = {}
  data['title'] = f"Links tagged with '{tag.name}'"
  paginator_data = await paginator.generate_paginator_context_data(
      request, queryset)
  breadcrumb_data = breadcrumbs.generate_breadcrumb_context_data([
      breadcrumbs.HOME, breadcrumbs.MANAGE_TAGS,
      breadcrumbs.TAGGED_LINKS(slug)
  ])
  data = data | paginator_data | breadcrumb_data
  return TemplateResponse(request, 'lynx/tagged_links_list.html', context=data)


@async_login_required
@lynx_post_only
async def link_tags_edit_view(request: HttpRequest, pk: int) -> HttpResponse:
  user = await request.auser()
  await headers.maybe_update_usersetting_headers(request, user)
  link = await aget_object_or_404(Link, pk=pk, user=user)
  if 'add_tags' in request.POST:
    ids = request.POST['add_tags'].split(',')
    tags = await aget_list_or_404(Tag, pk__in=ids, user=user)
    link = await add_tags_to_link(tags, link)
  if 'remove_tags' in request.POST:
    ids = request.POST['remove_tags'].split(',')
    tags = await aget_list_or_404(Tag, pk__in=ids, user=user)
    link = await remove_tags_from_link(tags, link)
  if 'clear_tags' in request.POST:
    await set_tags_on_link([], link)
  if 'set_tags' in request.POST:
    tag_ids = [
        key[9:-1] for key, value in request.POST.items()
        if key.startswith('set_tags[')
    ]
    tags = await aget_list_or_404(Tag, pk__in=tag_ids, user=user)
    link = await set_tags_on_link(tags, link)
  if 'add_new_tag' in request.POST:
    new_tag_name = request.POST.get('new_tag_name', None)
    if new_tag_name:
      tag = await create_tag_for_user(user, new_tag_name)
      link = await add_tags_to_link([tag], link)

  if 'next' in request.POST:
    return redirect(request.POST['next'])
  return redirect('lynx:links_feed')


@async_login_required
async def manage_tags_view(request: HttpRequest) -> HttpResponse:
  user = await request.auser()
  tags = await load_all_user_tags(user)
  breadcrumb_data = breadcrumbs.generate_breadcrumb_context_data(
      [breadcrumbs.HOME, breadcrumbs.MANAGE_TAGS])
  return TemplateResponse(request, 'lynx/manage_tags.html',
                          {'all_user_tags': tags} | breadcrumb_data)


@async_login_required
@lynx_post_only
async def delete_tag_view(request: HttpRequest, pk: int) -> HttpResponse:
  user = await request.auser()
  await headers.maybe_update_usersetting_headers(request, user)
  await delete_tag_for_user(user, pk)
  return redirect('lynx:manage_tags')


@async_login_required
@lynx_post_only
async def add_tag_view(request: HttpRequest) -> HttpResponse:
  if 'tag' in request.POST:
    user = await request.auser()
    await headers.maybe_update_usersetting_headers(request, user)
    await create_tag_for_user(user, request.POST['tag'])
  return redirect('lynx:manage_tags')
