import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import useLinkViewerQuery, { LinkView } from "@/hooks/useLinkViewerQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, LinkIcon, UserIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageWithHeader from "@/components/pages/PageWithHeader";
import React from "react";
import { usePocketBase } from "@/hooks/usePocketBase";

const ProgressIndicator: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full h-1 bg-gray-200 fixed bottom-0 left-0 z-50">
    <div
      className="h-full bg-blue-500 transition-all duration-300 ease-out"
      style={{ width: `${progress * 100}%` }}
    />
  </div>
);

const LinkViewer: React.FC = () => {
  const { id } = useParams();

  if (id === undefined) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No article ID provided.</AlertDescription>
      </Alert>
    );
  }

  const { result, loading, error } = useLinkViewerQuery(id, true);
  usePageTitle(result?.title || "View Link");

  if (result) {
    return (
      <PageWithHeader>
        <ArticleView linkView={result} />
      </PageWithHeader>
    );
  }

  if (loading) {
    return <LoadingView />;
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="w-full max-w-4xl mx-auto overflow-hidden"
      >
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return <div />;
};

const LoadingView = () => (
  <Card className="w-full max-w-4xl mx-auto overflow-hidden border-none">
    <div className="relative h-64">
      <Skeleton className="absolute inset-0" />
    </div>
    <CardHeader className="relative z-10">
      <Skeleton className="h-9 w-3/4 mb-4" />
      <div className="flex flex-wrap items-center gap-4">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-5 w-24" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className="h-6 w-16 rounded-full" />
        ))}
      </div>
    </CardHeader>
    <CardContent className="mt-6">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-4/5 mb-6" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-4/5 mb-6" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-4/5 mb-6" />
    </CardContent>
  </Card>
);

const ArticleView: React.FC<{ linkView: LinkView }> = ({ linkView }) => {
  const [progress, setProgress] = useState(linkView.reading_progress || 0);
  const { pb } = usePocketBase();
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const newProgress = scrollTop / scrollHeight;
    setProgress(newProgress);
  }, [setProgress]);
  const updateReadingProgress = useCallback(async () => {
    try {
      await pb
        .collection("links")
        .update(linkView.id, { reading_progress: progress });
    } catch (error) {
      console.error("Error updating reading progress:", error);
    }
  }, [pb, linkView.id, progress]);
  
  useEffect(() => {
    // Scroll to the saved reading progress on load
    if (linkView.reading_progress) {
      const scrollHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrollPosition = scrollHeight * linkView.reading_progress;
      window.scrollTo(0, scrollPosition);
    }
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [linkView.reading_progress, handleScroll]);
  useEffect(() => {
    const interval = setInterval(updateReadingProgress, 5000);
    return () => clearInterval(interval);
  }, [updateReadingProgress]);

  return (
    <>
      <ProgressIndicator progress={progress} />
      <Card className="w-full max-w-4xl mx-auto overflow-hidden">
        <div
          className="relative bg-cover bg-center h-64"
          style={{
            backgroundImage: linkView.header_image_url
              ? `url(${linkView.header_image_url})`
              : "none",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          <CardHeader className="relative z-10 text-white">
            <CardTitle className="text-3xl font-bold mb-4">
              {linkView.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {linkView.author && (
                <div className="flex items-center gap-1">
                  <UserIcon size={16} />
                  <span>{linkView.author}</span>
                </div>
              )}
              {linkView.article_date && (
                <div className="flex items-center gap-1">
                  <CalendarIcon size={16} />
                  <span>
                    {new Date(linkView.article_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {linkView.read_time_display && (
                <div className="flex items-center gap-1">
                  <ClockIcon size={16} />
                  <span>{linkView.read_time_display}</span>
                </div>
              )}
              {linkView.hostname && (
                <div className="flex items-center gap-1">
                  <LinkIcon size={16} />
                  <span>{linkView.hostname}</span>
                </div>
              )}
            </div>
            {linkView.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {linkView.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="bg-white bg-opacity-20"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
        </div>
        <CardContent className="mt-6">
          {linkView.excerpt && (
            <p className="text-gray-600 italic mb-4">{linkView.excerpt}</p>
          )}
          {linkView.article_html && (
            <div
              className="prose lg:prose-xl dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: linkView.article_html }}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default LinkViewer;
