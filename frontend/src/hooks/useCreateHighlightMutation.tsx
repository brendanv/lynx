import { useQueryClient, useMutation } from "@tanstack/react-query";
import { usePocketBase } from "@/hooks/usePocketBase";
import { LinkView } from "./useLinkViewerQuery";
import { notifications } from "@mantine/notifications";

type MutationArgs = {
  link: LinkView;
  highlightedText: string;
  serializedRange: string;
};
const useCreateHighlightMutation = () => {
  const { pb, user } = usePocketBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      link,
      highlightedText,
      serializedRange,
    }: MutationArgs) => {
      if (!user) {
        throw "no user";
      }
      return await pb.collection("highlights").create({
        user: user.id,
        link: link.id,
        highlighted_text: highlightedText,
        serialized_range: serializedRange,
        link_backup_url: link.cleaned_url,
        link_backup_hostname: link.hostname,
        link_backup_title: link.title,
      });
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["link", { id: variables.link.id, type: "full" }],
      });
    },
    onError: (error) => {
      console.error(error);
      notifications.show({
        title: "Unable to save highlight",
        message: error.message,
        color: "red",
      });
    },
  });
};

export default useCreateHighlightMutation;
