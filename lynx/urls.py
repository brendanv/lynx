from django.urls import path

from . import views

app_name = 'lynx'
urlpatterns = [
    # Feed
    path("", views.link_feed_view, name="links_feed"),
    path("tagged/<str:slug>/",
         views.tagged_links_view,
         name="links_feed_tagged"),

    # Link views + actions
    path("<int:pk>/details/", views.details_view, name="link_details"),
    path("<int:pk>/view", views.readable_view, name="link_viewer"),
    path("add/", views.add_link_view, name="add_link"),
    path("<int:pk>/action/", views.link_actions_view, name="link_action"),
    path("<int:pk>/tags/edit/",
         views.link_tags_edit_view,
         name="link_tags_edit"),
    path("<int:link_pk>/add_note/", views.add_note_view, name="add_note"),

    path("<int:link_pk>/archive/", views.link_archive_view, name="link_archive"),
    path("<int:link_pk>/archive/create/", views.create_archive_view, name="create_link_archive"),

    path("<int:link_pk>/notes/", views.link_notes_view, name="link_notes"),
    path("notes/", views.all_notes_view, name="all_notes"),
    path("note/<int:pk>/delete/", views.delete_note_view, name="delete_note"),

    # Feed views
    path("feeds/", views.feeds_list_view, name="feeds"),
    path("feeds/refresh_all/",
         views.refresh_all_feeds_view,
         name="refresh_all_feeds"),
    path("feeds/add/", views.add_feed_view, name="add_feed"),
    path("feeds/<int:feed_id>/items/",
         views.feed_items_list_view,
         name="feed_items"),
    path("feeds/<int:feed_id>/edit/", views.edit_feed_view, name="edit_feed"),
    path("feeds/<int:pk>/refresh/",
         views.refresh_feed_from_remote_view,
         name="refresh_feed"),
    path("feeds/<int:pk>/delete/", views.delete_feed_view, name="delete_feed"),
    path("feeds/<int:pk>/add_all_items_to_library/",
         views.add_all_feed_items_to_library_view,
         name="add_all_items_to_library"),
    path("feed_item/<int:pk>/add_to_library/",
         views.add_feed_item_to_library_view,
         name="add_feed_item_to_library"),
    path("feed_item/<int:pk>/remove_from_library/",
         views.remove_feed_item_from_library_view,
         name="remove_feed_item_from_library"),

    # User settings
    path('settings/', views.update_settings_view, name='user_settings'),
    path('cookies/', views.UpdateCookiesView.as_view(), name='user_cookies'),
    path('bulk_upload/', views.bulk_upload_view, name='bulk_upload'),
    path('tags/manage/', views.manage_tags_view, name='manage_tags'),
    path('tags/<int:pk>/delete/', views.delete_tag_view, name='delete_tag'),
    path('tags/add/', views.add_tag_view, name='add_tag'),
]
