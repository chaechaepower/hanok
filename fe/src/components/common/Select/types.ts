export type CustomSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export type DescriptionPlacement = 'bottom' | 'right';

export type DescriptionPosition = {
  top: number;
  left: number;
};

export type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  descriptionPlacement?: DescriptionPlacement;
};
