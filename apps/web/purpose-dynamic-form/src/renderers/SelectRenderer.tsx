import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Text,
} from "react-aria-components";

interface Props {
  description?: string | undefined;
  error?: string | undefined;
  label?: string | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}

export function SelectRenderer({
  description,
  error,
  label,
  onChange,
  options,
  value,
}: Props) {
  return (
    <Select
      className="flex flex-col gap-1"
      isInvalid={!!error}
      onSelectionChange={(key) => onChange(key as string)}
      selectedKey={value}
    >
      <Label className="text-sm font-medium text-gray-900">{label}</Label>
      {description && (
        <Text className="text-xs text-gray-500" slot="description">
          {description}
        </Text>
      )}
      <Button className="border border-gray-300 rounded-md px-3 py-2 text-sm text-left bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500">
        <SelectValue />
        <span className="text-gray-400">▼</span>
      </Button>
      <Popover className="bg-white border border-gray-200 rounded-md shadow-lg">
        <ListBox className="p-1 max-h-60 overflow-auto">
          {options.map((opt) => (
            <ListBoxItem
              className="px-3 py-2 text-sm rounded cursor-pointer hover:bg-blue-50 data-focused:bg-blue-50 data-selected:bg-blue-100"
              id={opt.value}
              key={opt.value}
            >
              {opt.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
      {error && (
        <Text className="text-xs text-red-600" slot="errorMessage">
          {error}
        </Text>
      )}
    </Select>
  );
}
