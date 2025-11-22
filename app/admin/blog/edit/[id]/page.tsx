import { BlogPostForm } from '@/components/admin/BlogPostForm';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditBlogPostPage({ params }: PageProps) {
  return <BlogPostForm postId={params.id} />;
}

