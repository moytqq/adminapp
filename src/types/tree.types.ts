import { WidgetItem } from '@/types/widget.types';

export interface TreeItem {
  id: string;
  label: string;
  subLabel?: string;
  children?: TreeItem[];
  isExpanded?: boolean;
  level: number;
  hasChildren?: boolean;
  data?: any;
  widgetData?: WidgetItem[];
}

export interface TreeState {
  items: TreeItem[];
  selectedItemId: string | null;
  loading: boolean;
  error: string | null;
}

