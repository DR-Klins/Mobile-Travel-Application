import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  BackHandler,
  Alert,
} from 'react-native';
import {
  useNavigation,
  NavigationProp,
  RouteProp,
} from '@react-navigation/native';
import {RootStackParamList} from '../App';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios, {AxiosError} from 'axios';
import Video from 'react-native-video';

type VideoData = {
  _id: string;
  url: string;
  format: string;
  asset_id: string;
  resource_type: string;
  tripId: string;
  tripName: string;
  created_at: string;
};

type TravelerProfileProps = {
  route: RouteProp<RootStackParamList, 'TravelerProfile'>;
};

const TravelerProfile = ({route}: TravelerProfileProps) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {user_id} = route.params; // Expecting userId from previous page
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log('UserID:', user_id);

        const response = await axios.post(
          'http://192.168.100.72:4000/api/v1/getCuts',
          {user_id: user_id},
        );

        if (response.data && response.data.success && response.data.cuts) {
          setVideos(
            Array.isArray(response.data.cuts)
              ? response.data.cuts
              : [response.data.cuts],
          );
        }
      } catch (error) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          console.error('Error fetching videos:', axiosError.response.data);
          Alert.alert('Error', 'Video not found (404)');
        } else if (axiosError.request) {
          console.error('Error making request:', axiosError.request);
          Alert.alert('Error', 'No response received from the server');
        } else {
          console.error('Error:', axiosError.message);
          Alert.alert('Error', 'An unexpected error occurred');
        }
      }
    };

    fetchVideos();
  }, [user_id]);

  const handleItineraryPress = () => {
    if (selectedVideo) {
      navigation.navigate('TripLandingPage', {tripId: selectedVideo.tripId});
    }
  };

  const handleCreateTripPress = () => {
    navigation.navigate('CreateTrip');
  };

  const handleBagPress = () => {
    navigation.navigate('Bag');
  };

  const openVideo = (video: VideoData) => setSelectedVideo(video);
  const closeVideo = () => setSelectedVideo(null);

  useEffect(() => {
    const backAction = () => {
      if (selectedVideo) {
        closeVideo();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [selectedVideo]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const getRandomShape = () => {
    const shapes = [
      {width: 150, height: 150, borderRadius: 10}, // Square
      {width: 180, height: 120, borderRadius: 15}, // Rectangle
      {width: 150, height: 150, borderRadius: 75}, // Circle
      {width: 170, height: 130, borderRadius: 20}, // Rounded rectangle
    ];
    return shapes[Math.floor(Math.random() * shapes.length)];
  };

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{uri: 'https://via.placeholder.com/120'}}
          style={styles.profilePhoto}
        />
        <Text style={styles.username}>Username</Text>
        <Text style={styles.bio}>Traveler | Adventurer | Blogger</Text>
      </View>

      {/* Masonry Grid of Videos */}
      <FlatList
        data={videos}
        keyExtractor={item => item._id}
        numColumns={2}
        contentContainerStyle={styles.masonryGrid}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              styles.videoTile,
              getRandomShape(),
              {backgroundColor: getRandomColor()},
            ]}
            onPress={() => openVideo(item)}>
            <Text style={styles.tripName}>{item.tripName}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal for Video Preview */}
      {selectedVideo && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeVideo}>
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <Video
              source={{uri: selectedVideo.url}}
              style={styles.modalVideo}
              resizeMode="cover"
              repeat={true}
            />
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
    padding: 20,
    alignItems: 'center',
  },
  profileSection: {
    width: '90%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 20,
    elevation: 5,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#3D9676',
    marginBottom: 10,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  bio: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 5,
  },
  bagButton: {
    position: 'absolute',
    top: 60,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3D9676',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  createTripButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E7B171',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  masonryGrid: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  videoTile: {
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tripName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  itineraryButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#3D9676',
    padding: 10,
    borderRadius: 5,
  },
  itineraryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TravelerProfile;
