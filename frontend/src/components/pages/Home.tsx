import { useState } from "react";
import Header from "@/components/Header";
import useLinksFeedQuery from "@/hooks/useLinksFeedQuery";
import LinkCard from "@/components/LinkCard";

const Home = () => {
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

  return (
    <>
      <Header />
      <main className="container mx-auto mt-20">
        {queryResult &&
          queryResult.items.map((item) => <LinkCard key={item.id} link={item} />)}
      </main>
    </>
  );
};

export default Home;
