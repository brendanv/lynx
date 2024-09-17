import React, { useState } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import PageWithHeader from "@/components/pages/PageWithHeader";
import SettingsBase from "@/components/pages/settings/SettingsBase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type ProgressState = {
  tags: number;
  feeds: number;
  feedItems: number;
  links: number;
};

const ImportLynxV1: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    tags: 0,
    feeds: 0,
    feedItems: 0,
    links: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const { pb, user } = usePocketBase();
  const {toast} = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    if (!user) return;

    setIsImporting(true);
    setError(null);
    setProgress({ tags: 0, feeds: 0, feedItems: 0, links: 0 });

    const worker = new Worker(
      new URL("@/workers/importLynxV1.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event) => {
      if (event.data.type === "progress") {
        setProgress((prev) => ({
          ...prev,
          [event.data.category]: event.data.progress,
        }));
      } else if (event.data.type === "error") {
        setError(event.data.error);
      } else if (event.data.type === "complete") {
        toast({
          title: 'Import complete!',
          description: 'Your feeds, tags, and links have been imported.',
        });
        setIsImporting(false);
      }
    };

    const fileContent = await file.text();
    worker.postMessage({
      jsonData: fileContent,
      pocketbaseUrl: pb.baseUrl,
      userToken: pb.authStore.token,
      userId: user.id,
    });
  };

  const renderProgressBar = (label: string, value: number) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>{label}</span>
        <span>{value.toFixed(0)}%</span>
      </div>
      <Progress value={value} className="w-full" />
    </div>
  );

  return (
    <PageWithHeader>
      <SettingsBase>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Import Lynx V1 Data</CardTitle>
            <CardDescription>
              Import your data from a Lynx V1 JSON export file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="flex-grow"
                />
                <Button
                  onClick={handleImport}
                  disabled={!file || isImporting}
                  className="min-w-[120px]"
                >
                  {isImporting ? "Importing..." : "Start Import"}
                </Button>
              </div>
              {isImporting && (
                <div className="space-y-4 bg-secondary p-4 rounded-md">
                  {renderProgressBar("Tags", progress.tags)}
                  {renderProgressBar("Feeds", progress.feeds)}
                  {renderProgressBar("Feed Items", progress.feedItems)}
                  {renderProgressBar("Links", progress.links)}
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </SettingsBase>
    </PageWithHeader>
  );

};

export default ImportLynxV1;
