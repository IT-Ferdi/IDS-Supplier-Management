import { RefreshCw } from 'lucide-react';
import { Button } from './button';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

const RefreshButton = ({ onRefresh, isLoading = false }: RefreshButtonProps) => {
  return (
    <Button
      onClick={onRefresh}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );
};

export default RefreshButton; 