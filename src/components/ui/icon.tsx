import { icons } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { memo } from 'react';

interface IconProps extends Omit<LucideProps, 'name'> {
  name: string | null | undefined;
}

export const Icon = memo(({ name, ...props }: IconProps) => {
  if (!name) return null;

  // Normalize name to PascalCase (e.g. 'shopping-bag' -> 'ShoppingBag')
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // Check if it's a valid Lucide icon name
  const IconComponent = icons[pascalName as keyof typeof icons] || icons[name as keyof typeof icons];

  if (IconComponent) {
    return <IconComponent {...props} />;
  }

  // If not a Lucide icon, assume it's an emoji or text
  return (
    <span role="img" aria-label={name} className={props.className}>
      {name}
    </span>
  );
});

Icon.displayName = 'Icon';
