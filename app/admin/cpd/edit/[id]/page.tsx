import { CPDForm } from '@/components/admin/CPDForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditCPDArticlePage({ params }: PageProps) {
  return <CPDForm articleId={params.id} />;
}

