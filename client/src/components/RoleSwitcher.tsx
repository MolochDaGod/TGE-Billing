import { Eye, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRoleSwitch } from '@/contexts/RoleSwitchContext';
import { Badge } from '@/components/ui/badge';
import type { User } from '@shared/schema';

interface RoleSwitcherProps {
  user: User;
}

export function RoleSwitcher({ user }: RoleSwitcherProps) {
  const { viewAsRole, setViewAsRole, effectiveRole, canSwitchRoles } = useRoleSwitch();
  
  if (!canSwitchRoles) {
    return null;
  }
  
  const roleOptions: { value: User['role'] | null; label: string }[] = [
    { value: null, label: `${user.role.replace('_', ' ').toUpperCase()} View` },
    { value: 'client', label: 'Client View' },
  ];
  
  const getCurrentLabel = () => {
    if (viewAsRole === 'client') {
      return 'Client View';
    }
    return user.role.replace('_', ' ').toUpperCase();
  };
  
  return (
    <div className="flex items-center gap-2" data-testid="role-switcher">
      {viewAsRole && (
        <Badge variant="secondary" className="gap-1" data-testid="badge-viewing-as">
          <Eye className="h-3 w-3" />
          Viewing as {viewAsRole}
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            data-testid="button-role-switcher"
          >
            <UserCog className="h-4 w-4" />
            {getCurrentLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Switch View</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {roleOptions.map((option) => (
            <DropdownMenuItem
              key={option.value || 'default'}
              onClick={() => setViewAsRole(option.value)}
              className={effectiveRole === (option.value || user.role) ? 'bg-accent' : ''}
              data-testid={`menuitem-view-${option.value || 'default'}`}
            >
              {option.value === null && <UserCog className="mr-2 h-4 w-4" />}
              {option.value === 'client' && <Eye className="mr-2 h-4 w-4" />}
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
