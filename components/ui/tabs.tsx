import React, { createContext, useContext, useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MotiView } from 'moti';

// Context for managing tab state
const TabsContext = createContext<{
  value: string;
  onValueChange: (value: string) => void;
  activeTab: string;
}>({
  value: '',
  onValueChange: () => {},
  activeTab: '',
});

// Types
interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

// Main Tabs component
export function Tabs({
  value,
  onValueChange,
  defaultValue = '',
  children,
}: TabsProps) {
  // If value isn't provided, use internal state
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  // Use controlled or uncontrolled pattern
  const activeTab = value !== undefined ? value : internalValue;

  // Handle value change
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    // Always update internal value
    setInternalValue(newValue);
  };

  return (
    <TabsContext.Provider
      value={{
        value: activeTab,
        onValueChange: handleValueChange,
        activeTab: activeTab,
      }}
    >
      <View className="w-full">{children}</View>
    </TabsContext.Provider>
  );
}

// TabsList component
export function TabsList({
  children,
  className = '',
  scrollable = false,
}: TabsListProps) {
  const Container = scrollable ? ScrollView : View;
  
  return (
    <Container
      horizontal={scrollable}
      showsHorizontalScrollIndicator={false}
      className={`flex flex-row bg-gray-100 rounded-lg p-1 ${className}`}
    >
      {children}
    </Container>
  );
}

// TabsTrigger component
export function TabsTrigger({
  value,
  children,
  className = '',
  disabled = false,
}: TabsTriggerProps) {
  const { activeTab, onValueChange } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(value)}
      activeOpacity={disabled ? 1 : 0.7}
      className={`px-3 py-2 relative ${
        isActive 
          ? 'text-foreground' 
          : 'text-muted-foreground'
      } ${disabled ? 'opacity-50' : ''} ${className}`}
      disabled={disabled}
    >
      {isActive && (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 200 }}
          className="absolute inset-0 bg-white rounded-md shadow-sm"
          style={StyleSheet.absoluteFill}
        />
      )}
      
      <Text
        className={`text-center font-medium z-10 ${
          isActive ? 'text-black' : 'text-gray-500'
        }`}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

// TabsContent component
export function TabsContent({
  value,
  children,
  className = '',
}: TabsContentProps) {
  const { activeTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  // Don't render if not active
  if (!isActive) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 5 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      className={`mt-2 ${className}`}
    >
      {children}
    </MotiView>
  );
} 