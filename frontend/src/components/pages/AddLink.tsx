import { useState } from "react";
import { AlertCircle, CircleCheckBig } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { usePocketBase } from "@/hooks/usePocketBase";
import parseNewLink from "@/utils/parseNewLink";
import FeedLink from "@/types/FeedLink";
import { Link } from "react-router-dom";
import URLS from "@/lib/urls";
import { usePageTitle } from "@/hooks/usePageTitle";
import PageWithHeader from "@/components/pages/PageWithHeader";

const URLParserForm = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<FeedLink | null>(null);
  const { pb } = usePocketBase();
  usePageTitle("Add Link");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setCreatedLink(null);
    setError(null);

    try {
      const newLink = await parseNewLink(url, pb);
      setCreatedLink(newLink);
      setUrl("");
    } catch (e: any) {
      console.log(e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWithHeader>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Save a Link</CardTitle>
          <CardDescription>
            Download, process, and save article content to read later
          </CardDescription>
        </CardHeader>
        <CardContent>
          {createdLink && (
            <Alert className="mb-4">
              <CircleCheckBig className="h-4 w-4" />
              <AlertTitle>{createdLink.title}</AlertTitle>
              <AlertDescription>{createdLink.excerpt}</AlertDescription>
              <Link to={URLS.LINK_VIEWER(createdLink.id)}>
                <Button variant="outline" className="mt-2">
                  Read Now
                </Button>
              </Link>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL"
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              Parse {createdLink ? "Another " : ""}URL
            </Button>
          </form>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </PageWithHeader>
  );
};

export default URLParserForm;
