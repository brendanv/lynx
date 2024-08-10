import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { usePocketBase } from "@/hooks/usePocketBase";
import parseNewLink from "@/utils/parseNewLink";
import Header from "@/components/Header";

const URLParserForm = () => {
  const [url, setUrl] = useState("");
  const { pb } = usePocketBase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("submitting");
    await parseNewLink(
      'https://www.example.com',
      pb);
  };

  return (
    <>
      <Header />
    <div className="container mx-auto p-4 mt-20 ">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>URL Parser</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL"
            />
            <Button type="submit" className="w-full">
              Parse URL
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default URLParserForm;
