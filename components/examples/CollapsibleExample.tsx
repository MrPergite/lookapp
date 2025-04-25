import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { ChevronDown, Plus, Settings, Info, Users, AlertCircle } from 'lucide-react-native';

export default function CollapsibleExample() {
  const [openBasic, setOpenBasic] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  // FAQ items
  const faqItems = [
    {
      id: 'faq-1',
      question: 'How do I create an account?',
      answer: 'You can create an account by clicking on the "Sign Up" button on the top right corner of the homepage. Follow the instructions to complete your registration.'
    },
    {
      id: 'faq-2',
      question: 'How do I reset my password?',
      answer: 'To reset your password, go to the login page and click on "Forgot Password". Enter your email address and follow the instructions sent to your email.'
    },
    {
      id: 'faq-3',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Apple Pay. Payment information is securely processed through our payment gateway.'
    },
    {
      id: 'faq-4',
      question: 'How can I contact customer support?',
      answer: 'You can reach our customer support team by email at support@example.com or by phone at (555) 123-4567 during our business hours (9am-5pm EST, Monday to Friday).'
    }
  ];

  // Handle FAQ toggle
  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Collapsible Examples</Text>
      
      {/* Basic Collapsible Example */}
      <View className="mb-8">
        <Text className="text-base font-semibold mb-2">Basic Collapsible</Text>
        
        <Collapsible 
          open={openBasic} 
          onOpenChange={setOpenBasic}
          className="border border-gray-200 rounded-md"
        >
          <CollapsibleTrigger className="p-4 bg-gray-50">
            <View className="flex-row items-center">
              <Settings size={18} color="#4b5563" className="mr-2" />
              <Text className="text-base font-medium">App Settings</Text>
            </View>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="p-4 border-t border-gray-200">
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text>Dark Mode</Text>
                <TouchableOpacity className="w-12 h-6 bg-gray-300 rounded-full">
                  <View className="w-5 h-5 bg-white rounded-full m-0.5" />
                </TouchableOpacity>
              </View>
              
              <View className="flex-row items-center justify-between">
                <Text>Notifications</Text>
                <TouchableOpacity className="w-12 h-6 bg-purple-500 rounded-full">
                  <View className="w-5 h-5 bg-white rounded-full m-0.5 ml-auto" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity className="mt-2 py-2 bg-gray-100 rounded-md">
                <Text className="text-center">Reset to Defaults</Text>
              </TouchableOpacity>
            </View>
          </CollapsibleContent>
        </Collapsible>
      </View>
      
      {/* FAQ Collapsibles */}
      <View className="mb-8">
        <Text className="text-base font-semibold mb-2">FAQ Collapsibles</Text>
        
        <View className="space-y-2">
          {faqItems.map((item) => (
            <Collapsible 
              key={item.id}
              open={openFAQ === item.id} 
              onOpenChange={() => toggleFAQ(item.id)}
              className="border border-gray-200 rounded-md overflow-hidden"
            >
              <CollapsibleTrigger className="p-4 bg-gray-50">
                <View className="flex-row items-center">
                  <Info size={16} color="#4b5563" style={{ marginRight: 8 }} />
                  <Text className="flex-1 text-base font-medium">{item.question}</Text>
                </View>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-4 bg-gray-50/50 border-t border-gray-200">
                <Text className="text-gray-600">{item.answer}</Text>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </View>
      </View>
      
      {/* Feature Overview Collapsible */}
      <View>
        <Text className="text-base font-semibold mb-2">Feature Overview</Text>
        
        <Collapsible 
          defaultOpen={true}
          className="border border-gray-200 rounded-md overflow-hidden"
        >
          <CollapsibleTrigger className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500">
            <View className="flex-row items-center">
              <Users size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text className="flex-1 text-white font-medium">Key App Features</Text>
            </View>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <View className="space-y-2 p-4">
              <View className="flex-row items-center p-2 bg-gray-50 rounded-md">
                <AlertCircle size={16} color="#8b5cf6" style={{ marginRight: 8 }} />
                <Text>Personalized user experience</Text>
              </View>
              
              <View className="flex-row items-center p-2 bg-gray-50 rounded-md">
                <AlertCircle size={16} color="#8b5cf6" style={{ marginRight: 8 }} />
                <Text>Real-time notifications and updates</Text>
              </View>
              
              <View className="flex-row items-center p-2 bg-gray-50 rounded-md">
                <AlertCircle size={16} color="#8b5cf6" style={{ marginRight: 8 }} />
                <Text>Cross-platform synchronization</Text>
              </View>
              
              <View className="flex-row items-center p-2 bg-gray-50 rounded-md">
                <AlertCircle size={16} color="#8b5cf6" style={{ marginRight: 8 }} />
                <Text>Enhanced security features</Text>
              </View>
            </View>
          </CollapsibleContent>
        </Collapsible>
      </View>
    </ScrollView>
  );
} 