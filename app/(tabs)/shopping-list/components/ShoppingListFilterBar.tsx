import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, useWindowDimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tag } from 'lucide-react-native';

// Define the filter categories relevant to Shopping List
const filterOptions = [
  { label: 'All Items', value: 'all' },
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Footwear', value: 'footwear' },
  { label: 'Accessory', value: 'accessory' },
];

export default function ShoppingListFilterBar({ activeFilter, setActiveFilter }: { activeFilter: string, setActiveFilter: (filter: string) => void }) {
  const { width } = useWindowDimensions();
  const isSm = width >= 640;

  return (
    <View style={styles.container}>
      <View
       style={styles.filterBar}
      >
        {filterOptions.map((category) => {
          const isActive = activeFilter === category.value;
          const fontSize = isSm ? 14 : 12;

          return (
            <TouchableOpacity
              key={category.value}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(category.value)}
              style={styles.chipTouchable}
            >
              {isActive ? (
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899', '#3B82F6']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.filterChip, styles.filterChipActive]}
                >
                  {category.value !== 'all' && <Tag size={12} color="#fff" style={{ marginRight: 4 }} />}
                  <Text style={[styles.filterTextActive, { fontSize }]}>{category.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.filterChip, styles.filterChipInactive]}>
                  <Text style={[styles.filterText, { fontSize }]}>{category.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {backgroundColor:'#FFFFFF'},
    filterBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      paddingHorizontal: 12,
    },
  chipTouchable: {
    marginRight: 8,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  filterChipActive: {
    boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)), 0 2px 4px -2px rgba(0,0,0,0.1)',

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipInactive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterText: { fontSize: 12, color: '#374151' },
  filterTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
});
