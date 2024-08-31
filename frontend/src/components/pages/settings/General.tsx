import React, { useState, useEffect } from "react";
import { usePocketBase } from "@/hooks/usePocketBase";
import PageWithHeader from "@/components/pages/PageWithHeader";
import SettingsBase from "@/components/pages/settings/SettingsBase";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/components/ui/use-toast";

const General: React.FC = () => {
  const { pb, user } = usePocketBase();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    openai_api_key: "",
    anthropic_api_key: "",
    automatically_summarize_new_links: false,
    summarization_model: "",
    id: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  usePageTitle("Settings");

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const record = await pb
          .collection("user_settings")
          .getFirstListItem(`user="${user.id}"`);
        setSettings({
          openai_api_key: record.openai_api_key || "",
          anthropic_api_key: record.anthropic_api_key || "",
          automatically_summarize_new_links:
            record.automatically_summarize_new_links || false,
          summarization_model: record.summarization_model || "",
          id: record.id,
        });
        setError(null);
      } catch (error: any) {
        if (error.status === 404) {
          // Settings don't exist, create new ones
          try {
            const newRecord = await pb.collection("user_settings").create({
              user: user.id,
            });
            setSettings({ ...settings, ...newRecord });
          } catch (createError) {
            console.error("Error creating settings:", createError);
            setError("Failed to create settings. Please try again.");
          }
        } else {
          console.error("Error fetching settings:", error);
          setError("Failed to load settings. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [pb, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await pb.collection("user_settings").update(settings.id, settings);
      toast({
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      setError("Failed to update settings. Please try again.");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view settings.</div>;

  return (
    <PageWithHeader>
      <SettingsBase>
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="openai_api_key">OpenAI API Key</label>
                <Input
                  id="openai_api_key"
                  type="password"
                  value={settings.openai_api_key}
                  onChange={(e) =>
                    setSettings({ ...settings, openai_api_key: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="anthropic_api_key">Anthropic API Key</label>
                <Input
                  id="anthropic_api_key"
                  type="password"
                  value={settings.anthropic_api_key}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      anthropic_api_key: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_summarize"
                  checked={settings.automatically_summarize_new_links}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      automatically_summarize_new_links: checked,
                    })
                  }
                />
                <label htmlFor="auto_summarize">
                  Automatically summarize new links
                </label>
              </div>
              <div>
                <label htmlFor="summarization_model">Summarization Model</label>
                <Select
                  value={settings.summarization_model}
                  onValueChange={(value) =>
                    setSettings({ ...settings, summarization_model: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4O Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4O</SelectItem>
                    <SelectItem value="claude-3-haiku-20240307">
                      Claude 3 Haiku
                    </SelectItem>
                    <SelectItem value="claude-3-5-sonnet-20240620">
                      Claude 3.5 Sonnet
                    </SelectItem>
                    <SelectItem value="claude-3-opus-20240229">
                      Claude 3 Opus
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Save Settings</Button>
            </form>
          </CardContent>
        </Card>
      </SettingsBase>
    </PageWithHeader>
  );
};

export default General;
