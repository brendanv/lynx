import React, { useState } from "react";
import Header from "@/components/Header";
import useLinksFeedQuery from "@/hooks/useLinksFeedQuery";
import LinkCard, { LinkCardSkeleton } from "@/components/LinkCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Home: React.FC = () => {
  const [page, setPage] = useState(1);
  const [readState, setReadState] = useState<"all" | "read" | "unread">("all");
  const [tagId, setTagId] = useState<string | undefined>(undefined);

  const {
    loading: feedLoading,
    result: queryResult,
    error: feedError,
  } = useLinksFeedQuery({
    page,
    readState,
    tagId,
  });

  const renderContent = () => {
    if (feedLoading) {
      return Array.from({ length: 5 }, (_, index) => (
        <LinkCardSkeleton key={`skeleton-${index}`} />
      ));
    }

    if (queryResult && queryResult.items.length > 0) {
      return queryResult.items.map((item) => <LinkCard key={item.id} link={item} />);
    }

    if (feedError || !queryResult || queryResult.items.length === 0) {
      return (
        <Alert variant={feedError ? "destructive" : "default"}>
          <AlertTitle>{feedError ? "Error" : "No links found"}</AlertTitle>
          <AlertDescription>
            {feedError
              ? feedError.message
              : "Try adjusting your filters or add some new links to your feed."}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <>
      <Header />
      <main className="container mx-auto mt-20 p-4">
        {renderContent()}
      </main>
    </>
  );
};

export default Home;