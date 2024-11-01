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
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  const {tripId} = route.params;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<string[]>([]);

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
              trip_id: tripId,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);

        if (data.success) {
          setVideoUrl(data.vlog.url);
        } else {
          console.error('Error fetching vlog:', data.message);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchVlog();
  }, [tripId]);

  const handleLike = () => {
    setLikes(likes + 1);
  };

  const handleComment = () => {
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
          <Icon name="thumb-up" size={24} color="#FAD8B0" />
          <Text style={styles.buttonText}> {likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleComment}>
          <Icon name="comment" size={24} color="#FAD8B0" />
          <Text style={styles.buttonText}> Comment</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabsContainer}>
        <Tab.Navigator
          initialRouteName="Itinerary"
          screenOptions={({route}) => ({
            tabBarActiveTintColor: '#FAD8B0',
            tabBarInactiveTintColor: 'black',
            tabBarActiveBackgroundColor: '#3D9676', // Highlight the active tab
            tabBarInactiveBackgroundColor: '#415F5F', // Inactive tab background
            tabBarLabelStyle: {
              fontSize: 14,
              fontWeight: 'bold',
              textAlign: 'center', // Center the text horizontally
              paddingVertical: 10, // Adjust padding to center text vertically
            },
            tabBarIcon: () => null, // Remove the icon and its space
            tabBarStyle: {
              height: 60, // Adjust height of the tab bar for better vertical centering
            },
            headerShown: false, // Removes the top bar (header)
          })}>
          <Tab.Screen name="Reviews" component={Reviews} />
          <Tab.Screen
            name="Itinerary"
            children={() => <Itinerary tripId={tripId} />}
          />
          <Tab.Screen
            name="Destinations"
            children={() => <Destinations tripId={tripId} />}
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
    backgroundColor: '#1B3232',
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
    backgroundColor: '#3D9676',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FAD8B0',
    fontSize: 16,
    marginLeft: 5,
  },
  tabsContainer: {
    flex: 1,
    backgroundColor: '#1B3232',
  },
  commentsContainer: {
    padding: 10,
    backgroundColor: '#1B3232',
  },
  commentText: {
    fontSize: 14,
    color: '#FAD8B0',
    marginVertical: 2,
  },
});

export default TripLandingPage;
