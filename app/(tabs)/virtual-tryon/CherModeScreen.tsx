import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Dimensions, Switch, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';

type WardrobeItem = {
  id: string;
  name: string;
  image: string;
};

type WardrobeCategory = {
  tops: WardrobeItem[];
  bottoms: WardrobeItem[];
  shoes: WardrobeItem[];
};

interface CherModeScreenProps {
  onToggleMode: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CherModeScreen: React.FC<CherModeScreenProps> = ({ onToggleMode }) => {
  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [browseMode, setBrowseMode] = useState(false);
  const [browsing, setBrowsing] = useState<'tops' | 'bottoms' | null>(null);
  
  // Refs for scrolling
  const topsScrollRef = useRef<any>(null);
  const bottomsScrollRef = useRef<any>(null);
  
  const [autoScroll, setAutoScroll] = useState(false);
  
  const scrollAnim = useRef(new Animated.Value(0)).current;
  
  // Sample wardrobe data
  const wardrobe: WardrobeCategory = {
    tops: [
      { id: 't1', name: 'Plaid Blazer', image: 'https://images.unsplash.com/photo-1551489186-cf8726f514f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { id: 't2', name: 'Yellow Cardigan', image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { id: 't3', name: 'Plaid Jacket', image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { id: 't4', name: 'White Blouse', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { id: 't5', name: 'Striped Shirt', image: 'https://images.unsplash.com/photo-1577655197620-704858b270ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
    ],
    bottoms: [
      { id: 'b1', name: 'Plaid Skirt', image: 'https://images.unsplash.com/photo-1582142306909-195724d0a735?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { id: 'b2', name: 'Black Skirt', image: 'https://images.unsplash.com/photo-1542574271-7f3b92e6c821?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { id: 'b3', name: 'Mini Skirt', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a6b8c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { id: 'b4', name: 'Pleated Skirt', image: 'https://images.unsplash.com/photo-1577900232427-18219b8210eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
    ],
    shoes: [
      { id: 's1', name: 'Mary Janes', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { id: 's2', name: 'White Heels', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
    ],
  };
  
  const navigateTop = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setTopIndex(prev => (prev > 0 ? prev - 1 : wardrobe.tops.length - 1));
    } else {
      setTopIndex(prev => (prev < wardrobe.tops.length - 1 ? prev + 1 : 0));
    }
  };
  
  const navigateBottom = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setBottomIndex(prev => (prev > 0 ? prev - 1 : wardrobe.bottoms.length - 1));
    } else {
      setBottomIndex(prev => (prev < wardrobe.bottoms.length - 1 ? prev + 1 : 0));
    }
  };
  
  useEffect(() => {
    let anim = null;
    if (browseMode && autoScroll) {
      const itemCount = browsing === 'tops' ? wardrobe.tops.length : wardrobe.bottoms.length;
      const maxScroll = (itemCount - 1) * 200;
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scrollAnim, {
            toValue: maxScroll,
            duration: itemCount * 1200,
            useNativeDriver: false,
          }),
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );
      anim.start();
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [browseMode, browsing, autoScroll, wardrobe.tops.length, wardrobe.bottoms.length]);
  
  const handleBrowse = () => {
    setBrowseMode(true);
    setBrowsing('tops');
    setAutoScroll(true);
  };
  
  const handleSelectItem = (type: 'tops' | 'bottoms', index: number) => {
    setAutoScroll(false);
    if (type === 'tops') {
      setTopIndex(index);
    } else {
      setBottomIndex(index);
    }
    if (browsing === 'tops') {
      setBrowsing('bottoms');
      setAutoScroll(true);
    } else {
      setBrowseMode(false);
      setBrowsing(null);
    }
  };
  
  const renderNormalView = () => (
    <View style={styles.itemsStackContainer}>
      {/* Top item */}
      <MotiView
        style={styles.itemContainer}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 700, duration: 400 }}
      >
        <Image 
          source={{ uri: wardrobe.tops[topIndex].image }}
          style={styles.itemImage}
          contentFit="contain"
        />
        
        <View style={styles.navigationRow}>
          <TouchableOpacity 
            style={[styles.navButton, { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]}
            onPress={() => navigateTop('prev')}
          >
            <Text style={styles.navButtonText}>{'◀◀'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateTop('prev')}
          >
            <Text style={styles.navButtonText}>{'◀'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateTop('next')}
          >
            <Text style={styles.navButtonText}>{'▶'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, { borderTopRightRadius: 4, borderBottomRightRadius: 4 }]}
            onPress={() => navigateTop('next')}
          >
            <Text style={styles.navButtonText}>{'▶▶'}</Text>
          </TouchableOpacity>
        </View>
      </MotiView>
      
      {/* Bottom item */}
      <MotiView
        style={styles.itemContainer}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 900, duration: 400 }}
      >
        <Image 
          source={{ uri: wardrobe.bottoms[bottomIndex].image }}
          style={styles.itemImage}
          contentFit="contain"
        />
        
        <View style={styles.navigationRow}>
          <TouchableOpacity 
            style={[styles.navButton, { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]}
            onPress={() => navigateBottom('prev')}
          >
            <Text style={styles.navButtonText}>{'◀◀'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateBottom('prev')}
          >
            <Text style={styles.navButtonText}>{'◀'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateBottom('next')}
          >
            <Text style={styles.navButtonText}>{'▶'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navButton, { borderTopRightRadius: 4, borderBottomRightRadius: 4 }]}
            onPress={() => navigateBottom('next')}
          >
            <Text style={styles.navButtonText}>{'▶▶'}</Text>
          </TouchableOpacity>
        </View>
      </MotiView>
    </View>
  );
  
  const renderBrowseView = () => {
    console.log("Rendering browse view for", browsing);
    return (
      <View style={styles.browseContainer}>
        <Text style={styles.browseTitle}>
          {browsing === 'tops' ? 'SELECT A TOP' : 'SELECT A BOTTOM'}
        </Text>
        
        <Animated.ScrollView
          horizontal
          ref={browsing === 'tops' ? topsScrollRef : bottomsScrollRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.browseScrollContent}
          style={{ width: SCREEN_WIDTH - 40, height: 240, backgroundColor: 'transparent', alignSelf: 'center' }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollAnim } } }],
            { useNativeDriver: false }
          )}
          scrollEnabled={false}
        >
          {(browsing === 'tops' ? wardrobe.tops : wardrobe.bottoms).map((item, index) => (
            <MotiView
              key={item.id}
              style={styles.browseItemWrapper}
              from={{ opacity: 0, scale: 0.9, translateX: 50 }}
              animate={{ opacity: 1, scale: 1, translateX: 0 }}
              transition={{ delay: 100 + (index * 150), duration: 400 }}
            >
              <TouchableOpacity
                style={styles.browseItem}
                onPress={() => handleSelectItem(browsing as 'tops' | 'bottoms', index)}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.browseImage}
                  contentFit="cover"
                />
                <View style={styles.browseNameContainer}>
                  <Text style={styles.browseName}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </Animated.ScrollView>
        
        <TouchableOpacity 
          style={styles.cancelBrowseButton}
          onPress={() => {
            setBrowseMode(false);
            setBrowsing(null);
          }}
        >
          <Text style={styles.cancelBrowseText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    const listener = scrollAnim.addListener(({ value }) => {
      if (browsing === 'tops') {
        topsScrollRef.current?.scrollTo({ x: value, animated: false });
      } else if (browsing === 'bottoms') {
        bottomsScrollRef.current?.scrollTo({ x: value, animated: false });
      }
    });
    return () => {
      scrollAnim.removeListener(listener);
    };
  }, [browsing]);

  return (
    <MotiView 
      style={styles.container}
      from={{ 
        opacity: 0,
      }}
      animate={{ 
        opacity: 1,
      }}
      transition={{
        type: 'timing',
        duration: 600,
      }}
    >
      {/* Leopard print background */}
      <Image
        source={{ uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-9CkAETaohcdfiHM1eQm79RZUu2ikoo.png' }}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      
      {/* Toggle button at the top */}
      <View style={styles.toggleContainer}>
        <MotiView
          animate={{
            scale: 1.05,
          }}
          transition={{
            type: 'spring',
            damping: 15,
            repeat: 3,
            repeatReverse: true,
          }}
        >
          <TouchableOpacity
            onPress={onToggleMode}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>Exit Cher Mode</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
      
      {/* Computer interface container */}
      <MotiView 
        style={styles.computerFrame}
        from={{ translateY: 100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ delay: 300, duration: 500 }}
      >
        {/* Computer screen */}
        <View style={styles.screenContent}>
          {/* Title Bar */}
          <MotiView 
            style={styles.titleBar}
            from={{ scaleX: 0.8, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 600, duration: 300 }}
          >
            <Text style={styles.titleText}>FALL FASHIONS</Text>
          </MotiView>
          
          {/* Wardrobe layout */}
          <View style={styles.wardrobeContainer}>
            {/* Header labels */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerLabel}>WARDROBE</Text>
              <Text style={styles.headerLabel}>FALL FASHIONS</Text>
            </View>
          
            {/* Main content area - either normal view or browse view */}
            {browseMode ? renderBrowseView() : renderNormalView()}
            
            {/* Action buttons */}
            {!browseMode && (
              <View style={styles.actionButtonsContainer}>
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 1100, duration: 300 }}
                  style={styles.actionButtonWrapper}
                >
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      console.log("Browse button pressed");
                      handleBrowse();
                    }}
                  >
                    <Text style={styles.actionButtonText}>BROWSE</Text>
                  </TouchableOpacity>
                </MotiView>
                
                <View style={{ flex: 1 }} />
                
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 1200, duration: 300 }}
                  style={styles.actionButtonWrapper}
                >
                  <TouchableOpacity style={[styles.actionButton, styles.dressButton]}>
                    <Text style={styles.actionButtonText}>DRESS ME</Text>
                  </TouchableOpacity>
                </MotiView>
              </View>
            )}
          </View>
        </View>
      </MotiView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  toggleContainer: {
    position: 'absolute',
    top: 0, 
    right: 0,
    left: 0,
    zIndex: 10,
    alignItems: 'flex-end',
    paddingTop: 55,
    paddingRight: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF69B4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  toggleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  computerFrame: {
    margin: 20,
    marginTop: 100,
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 14,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    maxWidth: 650,
    alignSelf: 'center',
    width: '90%',
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#eef0ff', // Light blue/gray background like in the reference
    padding: 12,
  },
  titleBar: {
    backgroundColor: '#1e2761', // Dark blue like in the reference
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  titleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wardrobeContainer: {
    flex: 1,
    backgroundColor: '#eef0ff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  headerLabel: {
    color: '#1e2761',
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemsStackContainer: {
    flex: 1,
    justifyContent: 'space-around',
  },
  itemContainer: {
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#1e2761',
    height: '45%',
    marginHorizontal: 50,
    marginVertical: 10,
  },
  itemImage: {
    width: '100%',
    height: '80%',
    backgroundColor: 'white',
  },
  navigationRow: {
    flexDirection: 'row',
    height: '20%',
    backgroundColor: '#c7c9d9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 2,
    borderTopColor: '#1e2761',
  },
  navButton: {
    width: 50,
    height: '80%',
    backgroundColor: '#9597a7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e2761',
  },
  navButtonText: {
    color: '#1e2761',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  actionButtonWrapper: {
    width: 120,
  },
  actionButton: {
    backgroundColor: '#9597a7',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1e2761',
  },
  dressButton: {
    backgroundColor: '#4040F0', // Vibrant blue like in the reference
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  // Browse mode styles
  browseContainer: {
    flex: 1,
    marginTop: 10,
  },
  browseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e2761',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1,
  },
  browseScrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  browseItemWrapper: {
    marginHorizontal: 10,
    width: 180,
  },
  browseItem: {
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#1e2761',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  browseImage: {
    width: 180,
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  browseNameContainer: {
    padding: 8,
    backgroundColor: '#c7c9d9',
    borderTopWidth: 2,
    borderTopColor: '#1e2761',
  },
  browseName: {
    textAlign: 'center',
    color: '#1e2761',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelBrowseButton: {
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: '#FF5A5A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e2761',
  },
  cancelBrowseText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CherModeScreen; 