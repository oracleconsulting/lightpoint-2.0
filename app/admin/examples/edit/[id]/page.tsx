import { ExampleForm } from '@/components/admin/ExampleForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditExamplePage({ params }: PageProps) {
  return <ExampleForm exampleId={params.id} />;
}

