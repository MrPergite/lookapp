import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Settings, User, Bell, Menu } from 'lucide-react-native';

export default function TabsExample() {
  const [accountTab, setAccountTab] = useState('account');
  const [iconTab, setIconTab] = useState('home');
  const [scrollableTab, setScrollableTab] = useState('tab1');

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-6">Tabs Example</Text>
      
      {/* Basic Tabs */}
      <View className="mb-10">
        <Text className="text-base font-semibold mb-2">Basic Tabs</Text>
        <Tabs value={accountTab} onValueChange={setAccountTab}>
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Account Tab Content</Text>
              <Text className="text-gray-500 mt-2">
                Manage your account settings and preferences.
              </Text>
            </View>
          </TabsContent>
          <TabsContent value="password">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Password Tab Content</Text>
              <Text className="text-gray-500 mt-2">
                Update your password and security settings.
              </Text>
            </View>
          </TabsContent>
          <TabsContent value="settings">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Settings Tab Content</Text>
              <Text className="text-gray-500 mt-2">
                Configure your application settings.
              </Text>
            </View>
          </TabsContent>
        </Tabs>
      </View>
      
      {/* Tabs with Icons */}
      <View className="mb-10">
        <Text className="text-base font-semibold mb-2">Tabs with Icons</Text>
        <Tabs value={iconTab} onValueChange={setIconTab} defaultValue="home">
          <TabsList>
            <TabsTrigger value="home" className="flex-row items-center">
              <Home size={16} color={iconTab === 'home' ? '#000' : '#6b7280'} />
              <Text className="ml-2">Home</Text>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-row items-center">
              <User size={16} color={iconTab === 'profile' ? '#000' : '#6b7280'} />
              <Text className="ml-2">Profile</Text>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-row items-center">
              <Bell size={16} color={iconTab === 'notifications' ? '#000' : '#6b7280'} />
              <Text className="ml-2">Alerts</Text>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="home">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Home Content</Text>
            </View>
          </TabsContent>
          <TabsContent value="profile">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Profile Content</Text>
            </View>
          </TabsContent>
          <TabsContent value="notifications">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Notifications Content</Text>
            </View>
          </TabsContent>
        </Tabs>
      </View>
      
      {/* Scrollable Tabs */}
      <View>
        <Text className="text-base font-semibold mb-2">Scrollable Tabs</Text>
        <Tabs value={scrollableTab} onValueChange={setScrollableTab} defaultValue="tab1">
          <TabsList scrollable className="max-w-full">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            <TabsTrigger value="tab4">Tab 4</TabsTrigger>
            <TabsTrigger value="tab5">Tab 5</TabsTrigger>
            <TabsTrigger value="tab6">Tab 6</TabsTrigger>
            <TabsTrigger value="tab7">Tab 7</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Content for Tab 1</Text>
            </View>
          </TabsContent>
          <TabsContent value="tab2">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Content for Tab 2</Text>
            </View>
          </TabsContent>
          <TabsContent value="tab3">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Content for Tab 3</Text>
            </View>
          </TabsContent>
          {/* Additional TabsContent components for other tabs */}
          <TabsContent value="tab4">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Content for Tab 4</Text>
            </View>
          </TabsContent>
          <TabsContent value="tab5">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Content for Tab 5</Text>
            </View>
          </TabsContent>
          <TabsContent value="tab6">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Content for Tab 6</Text>
            </View>
          </TabsContent>
          <TabsContent value="tab7">
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="font-medium">Content for Tab 7</Text>
            </View>
          </TabsContent>
        </Tabs>
      </View>
    </View>
  );
} 