import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePocketBase } from '@/hooks/usePocketBase';

const ArchiveViewer: React.FC = () => {
  const { id: linkId } = useParams<{ id: string }>();
  const [archiveContent, setArchiveContent] = useState<string | null>(null);
  const { pb } = usePocketBase();

  useEffect(() => {
    const fetchArchiveContent = async () => {
      if (!linkId) return;
      try {
        const link = await pb.collection('links').getOne(linkId);
        const archiveUrl = pb.files.getUrl(link, link.archive);
        const response = await fetch(archiveUrl);
        const content = await response.text();
        setArchiveContent(content);
      } catch (error) {
        console.error('Error fetching archive content:', error);
      }
    };

    if (linkId) {
      fetchArchiveContent();
    }
  }, [linkId, pb]);

  if (!archiveContent) {
    return <div />;
  }

  return (
    <div 
      className="archive-content"
      dangerouslySetInnerHTML={{ __html: archiveContent }}
    />
  );
};

export default ArchiveViewer;