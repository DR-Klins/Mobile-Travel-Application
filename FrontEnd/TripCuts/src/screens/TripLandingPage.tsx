import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import Video from 'react-native-video';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {RouteProp} from '@react-navigation/native';
import Reviews from './components/Reviews';
import Itinerary from './components/Itinerary';
import Destinations from './components/Destinations';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Importing Material Icons
import {useNavigation} from '@react-navigation/native';

type RootStackParamList = {
  TripLandingPage: {tripId: string};
};

type VideoScreenRouteProp = RouteProp<RootStackParamList, 'TripLandingPage'>;

type VideoScreenProps = {
  route: VideoScreenRouteProp;
};

const Tab = createBottomTabNavigator();

const TripLandingPage: React.FC<VideoScreenProps> = ({route}) => {
  const {tripId} = route.params; // Get tripId from route parameters
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<string[]>([]); // Store comments

  useEffect(() => {
    const fetchVlog = async () => {
      try {
        const response = await fetch(
          'http://192.168.100.72:4000/api/v1/getVlog',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trip_id: tripId, // Pass tripId directly
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        if (data.success) {
          setVideoUrl(data.vlog.url); // Assuming data.vlog.url contains the video URL
        } else {
          console.error('Error fetching vlog:', data.message);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchVlog();
  }, [tripId]); // Add tripId as a dependency

  const handleLike = () => {
    setLikes(likes + 1); // Increment likes
  };

  const handleComment = () => {
    // You can implement a modal or input dialog here for adding comments
    // For simplicity, I'm adding a hardcoded comment
    setComments([...comments, `Comment ${comments.length + 1}`]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        {videoUrl && (
          <Video
            source={{uri: videoUrl}}
            style={styles.videoPlayer}
            controls={true}
            resizeMode="contain"
            onError={error => console.log('Video Error: ', error)}
            onLoad={() => console.log('Video Loaded')}
          />
        )}
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={handleLike}>
          <Icon name="thumb-up" size={24} color="#fff" />
          <Text style={styles.buttonText}> {likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleComment}>
          <Icon name="comment" size={24} color="#fff" />
          <Text style={styles.buttonText}> Comment</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabsContainer}>
        <Tab.Navigator>
          <Tab.Screen name="Reviews" component={Reviews} />
          <Tab.Screen
            name="Itinerary"
            children={() => <Itinerary tripId={tripId} />} // Pass tripId as a prop
          />
          <Tab.Screen
            name="Destinations"
            children={() => <Destinations tripId={tripId} />} // Pass tripId as a prop
          />
        </Tab.Navigator>
      </View>
      <View style={styles.commentsContainer}>
        {comments.map((comment, index) => (
          <Text key={index} style={styles.commentText}>
            {comment}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  videoContainer: {
    height: Dimensions.get('window').height * 0.3,
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5, // Space between icon and text
  },
  tabsContainer: {
    flex: 1,
  },
  commentsContainer: {
    padding: 10,
  },
  commentText: {
    fontSize: 14,
    marginVertical: 2,
  },
});

export default TripLandingPage;
