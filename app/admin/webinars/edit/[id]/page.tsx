import { WebinarForm } from '@/components/admin/WebinarForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditWebinarPage({ params }: PageProps) {
  return <WebinarForm webinarId={params.id} />;
}

