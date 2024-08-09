import type FeedLink from "@/types/FeedLink";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import URLS from "@/lib/urls";

const LinkCard = ({ link }: { link: FeedLink }) => {
  return (
    <Card className="flex items-start p-4 gap-4 mb-4">
      <div className="flex-shrink-0">
        <img
          src={link.header_image_url || "/img/lynx_placeholder.png"}
          alt={link.title || ""}
          className="object-cover w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg"
        />
      </div>
      <div className="flex-grow min-w-0">
        <Link to={URLS.LINK_VIEWER(link.id)}>
          <CardHeader className="p-0">
            <CardTitle className="flex items-center justify-between">
              <span className="truncate">{link.title}</span>
            </CardTitle>
            <CardDescription>{link.hostname}</CardDescription>
          </CardHeader>
        </Link>
        <CardContent className="p-0 mt-2">
          <p className="line-clamp-2">{link.excerpt}</p>
        </CardContent>
      </div>
    </Card>
  );
};

export default LinkCard;
