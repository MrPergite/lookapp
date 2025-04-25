import React, { createContext, useContext, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { ChevronDown } from 'lucide-react-native';

// Types
interface CollapsibleContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Create context for Collapsible
const CollapsibleContext = createContext<CollapsibleContextType>({
  open: false,
  onOpenChange: () => {},
});

// Collapsible component props
interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

// CollapsibleTrigger component props
interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

// CollapsibleContent component props
interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
  forceMount?: boolean;
}

// Main Collapsible component
export function Collapsible({
  open,
  onOpenChange,
  defaultOpen = false,
  children,
  className = '',
}: CollapsibleProps) {
  // If open is not provided, use internal state
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  
  // Use controlled or uncontrolled pattern
  const isOpen = open !== undefined ? open : internalOpen;

  // Handle open state change
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    // Always update internal state
    setInternalOpen(newOpen);
  };

  return (
    <CollapsibleContext.Provider
      value={{
        open: isOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      <View className={`${className}`}>{children}</View>
    </CollapsibleContext.Provider>
  );
}

// CollapsibleTrigger component
export function CollapsibleTrigger({
  children,
  className = '',
  asChild = false,
}: CollapsibleTriggerProps) {
  const { open, onOpenChange } = useContext(CollapsibleContext);

  // For React Native, implementing asChild is more complex than in React DOM
  // So we'll just use a simplified approach and not implement it fully
  if (asChild) {
    console.warn('asChild prop is not fully supported in React Native Collapsible');
  }

  return (
    <TouchableOpacity
      onPress={() => onOpenChange(!open)}
      activeOpacity={0.7}
      className={`flex flex-row items-center justify-between ${className}`}
    >
      {children}
      <ChevronDown 
        size={16} 
        style={[open ? styles.iconRotated : styles.iconNormal]}
      />
    </TouchableOpacity>
  );
}

// CollapsibleContent component
export function CollapsibleContent({
  children,
  className = '',
  forceMount = false,
}: CollapsibleContentProps) {
  const { open } = useContext(CollapsibleContext);

  // If not open and not forcing mount, don't render anything
  if (!open && !forceMount) {
    return null;
  }

  // If forceMount is true, we need to apply hidden styles when closed
  const isVisible = open || forceMount;

  return (
    <MotiView
      animate={{
        height: open ? 'auto' : 0,
        opacity: open ? 1 : 0,
      }}
      transition={{
        type: 'timing',
        duration: 200,
      }}
      style={!isVisible && styles.hidden}
      className={`overflow-hidden ${className}`}
    >
      <View className={`py-1 ${!open && forceMount ? 'invisible' : 'visible'}`}>
        {children}
      </View>
    </MotiView>
  );
}

// Styles for icon rotation and hidden content
const styles = StyleSheet.create({
  iconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  iconNormal: {
    transform: [{ rotate: '0deg' }],
  },
  hidden: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
}); 