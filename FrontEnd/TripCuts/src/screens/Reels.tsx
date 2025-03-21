import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Animated,
  Modal,
  Text,
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import the icon library
import {
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {RootStackParamList} from '../App';

const {height} = Dimensions.get('window');

// Reference local video files from the assets/videos folder
const videos = [
  {id: '1', uri: require('./assets/cuts/8.mp4')},

  // Add more local video files as needed
];

const ReelsFeed = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // Specify type for navigation
  const [paused, setPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // Track the currently active video index
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [modalVisible, setModalVisible] = useState(false); // State for modal visibility
  const [source, setSource] = useState(''); // State for source input
  const [destination, setDestination] = useState(''); // State for destination input

  const doubleTapRef = useRef(null);
  const longPressRef = useRef(null);
  const flatListRef = useRef<FlatList>(null);

  // Animated values for the icons and search bar
  const opacity = useRef(new Animated.Value(0)).current; // For opacity
  const translateY = useRef(new Animated.Value(20)).current; // For translateY (slide in)

  const handleSingleTap = () => {
    setPaused(prev => !prev); // Toggle paused state
  };

  const handleDoubleTap = () => {
    console.log('Liked!');
    // Implement like functionality
  };

  const handleLongPress = () => {
    console.log('Comments section opened!');
    // Implement comments section
  };

  const handleViewableItemsChanged = useRef(({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index); // Update active index to the first visible item
      setPaused(false); // Ensure the current active video is playing
    }
  }).current;

  const handlePanGesture = (event: PanGestureHandlerGestureEvent) => {
    const {translationY} = event.nativeEvent;

    if (translationY < -100) {
      // Handle swipe up to change reel
      flatListRef.current?.scrollToOffset({
        offset: height * (activeIndex + 1),
        animated: true,
      });
    } else if (translationY > 100) {
      // Handle swipe down to go to previous reel
      flatListRef.current?.scrollToOffset({
        offset: height * (activeIndex - 1),
        animated: true,
      });
    }
  };
  const openMap = () => {
    setModalVisible(true); // Show modal before navigating
  };

  const handleGetRoute = () => {
    setModalVisible(false); // Hide modal
    navigation.navigate('Map'); // Navigate to the map page
  };

  const openSearchPage = () => {
    navigation.navigate('SearchPage'); // Navigate to SearchPage
  };

  const handleProfilePress = () => {
    console.log('Profile button pressed!');
    // Implement navigation to profile page
    navigation.navigate('Profile'); // Navigate to Profile screen
  };

  // Function to animate the appearance of icons and search bar
  const animateIconsAndSearchBar = (visible: boolean) => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Effect to handle visibility changes
  useEffect(() => {
    animateIconsAndSearchBar(paused); // Animate when paused state changes
  }, [paused]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={({item, index}) => (
          <PanGestureHandler onGestureEvent={handlePanGesture}>
            <TapGestureHandler
              waitFor={doubleTapRef}
              onActivated={handleSingleTap}>
              <TapGestureHandler
                ref={doubleTapRef}
                numberOfTaps={2}
                onActivated={handleDoubleTap}>
                <LongPressGestureHandler
                  ref={longPressRef}
                  onHandlerStateChange={({nativeEvent}) => {
                    if (nativeEvent.state === State.ACTIVE) {
                      handleLongPress();
                    }
                  }}>
                  <View style={styles.videoContainer}>
                    <Video
                      source={item.uri}
                      style={styles.video}
                      resizeMode="cover"
                      paused={paused || activeIndex !== index} // Only play the video if it is the active one
                      repeat
                    />
                  </View>
                </LongPressGestureHandler>
              </TapGestureHandler>
            </TapGestureHandler>
          </PanGestureHandler>
        )}
        keyExtractor={item => item.id}
        snapToAlignment="center"
        snapToInterval={height}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged} // Attach the viewable items change handler
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50, // Only consider an item "visible" if 50% of it is visible
        }}
      />

      {paused && ( // Conditional rendering based on paused state
        <>
          {/* Animated Map button with an icon */}
          <Animated.View
            style={[
              styles.mapButton,
              {
                opacity,
                transform: [{translateY}],
              },
            ]}>
            <TouchableOpacity onPress={openMap}>
              <Icon name="map" size={44} color="white" />
            </TouchableOpacity>
          </Animated.View>

          {/* Animated Profile button with an icon */}
          <Animated.View
            style={[
              styles.profileButton,
              {
                opacity,
                transform: [{translateY}],
              },
            ]}>
            <TouchableOpacity onPress={handleProfilePress}>
              <Icon name="user" size={54} color="white" />
            </TouchableOpacity>
          </Animated.View>

          {/* Animated Transparent search bar */}
          <Animated.View
            style={[
              styles.searchBar,
              {
                opacity,
                transform: [{translateY}],
              },
            ]}>
            <TouchableOpacity onPress={openSearchPage}>
              <TextInput
                placeholder="Search..."
                placeholderTextColor="white"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                editable={false} // Disable input here as it opens a new screen
              />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
      {/* Modal for source and destination input */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Source and Destination</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Source"
              placeholderTextColor="gray"
              value={source}
              onChangeText={setSource}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Destination"
              placeholderTextColor="gray"
              value={destination}
              onChangeText={setDestination}
            />
            <TouchableOpacity
              onPress={handleGetRoute}
              style={{
                padding: 10,
                backgroundColor: '#FAD8B0',
                borderRadius: 5,
              }}>
              <Text style={{color: '#1B3232', fontSize: 16}}>Get Route</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  videoContainer: {
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  messageButton: {
    position: 'absolute',
    right: 20, // Adjust position as needed
    bottom: 205, // Adjust position as needed
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
  },
  profileButton: {
    position: 'absolute',
    bottom: 100, // Adjust this based on search bar position
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Transparent background
    padding: 10,
    borderRadius: 25, // Rounded button
  },
  mapButton: {
    position: 'absolute',
    bottom: 200, // Adjust this based on search bar position
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Transparent background
    padding: 10,
    borderRadius: 25, // Rounded button
  },
  searchBar: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Transparent white
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 15,
  },
  searchInput: {
    color: 'white', // Text color inside the search bar
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#1B3232',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#E7B171',
  },
  modalInput: {
    backgroundColor: '#415F5F',
    width: '100%',
    borderWidth: 3,
    borderColor: '#E7B171',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
});

export default ReelsFeed;
