import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ImageBackground,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import Reels from './screens/Reels';
import Profile from './screens/Profile';
import CreateTrip from './screens/CreateTrip';
import Bag from './screens/Bag';
import CreateTripDetails from './screens/CreateTripDetails';
import MediaUpload from './screens/MediaUpload';
import TripLandingPage from './screens/TripLandingPage';
import SearchPage from './screens/SearchPage';
import TravelerProfile from './screens/TravelerProfile';
import Map from './screens/Map';
import {AuthProvider, useAuth} from './screens/context/AuthContext';

// Define types for navigation
export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  Reels: undefined;
  Profile: undefined;
  CreateTrip: undefined;
  Bag: undefined;
  CreateTripDetails: {tripId: string};
  MediaUpload: {tripId: string};
  TripLandingPage: {tripId: string};
  SearchPage: undefined;
  TravelerProfile: {user_id: string};
  Map: undefined;
};

// Define types for the OnboardingScreen navigation prop
type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

type OnboardingScreenProps = {
  navigation: OnboardingScreenNavigationProp;
};

const Stack = createStackNavigator<RootStackParamList>();

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({navigation}) => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      title: 'Explore the World',
      description:
        'Discover amazing destinations and adventures waiting for you.',
      image: require('./screens/assets/travel1.jpg'),
    },
    {
      title: 'Plan Your Trips',
      description: 'Easily create itineraries for your travels with our app.',
      image: require('./screens/assets/travel2.jpg'),
    },
    {
      title: 'Join Travel Buddy',
      description: 'Sign up now and start your journey with us!',
      image: require('./screens/assets/travel1.jpg'),
    },
  ];

  const renderItem = (
    item: {title: string; description: string; image: any},
    index: number,
  ) => (
    <ImageBackground
      key={index}
      source={item.image}
      style={styles.slide}
      resizeMode="cover">
      <View style={styles.overlay}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
        {/* Only show buttons on the last slide */}
        {index === slides.length - 1 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.registerButton]}
              onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const slideSize = Dimensions.get('window').width;
    const index = Math.floor(contentOffsetX / slideSize);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ref={scrollViewRef}>
        {slides.map((slide, index) => renderItem(slide, index))}
      </ScrollView>

      {/* Swipe instruction text, hidden on the last slide */}
      {currentIndex < slides.length - 2 && (
        <Text style={styles.swipeText}>swipe &gt;&gt;</Text>
      )}
    </View>
  );
};

// Authenticated stack component
const AuthenticatedStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Reels"
      component={Reels}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Profile"
      component={Profile}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="CreateTrip"
      component={CreateTrip}
      options={{headerShown: false}}
    />
    <Stack.Screen name="Bag" component={Bag} options={{headerShown: false}} />
    <Stack.Screen
      name="CreateTripDetails"
      component={CreateTripDetails}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="MediaUpload"
      component={MediaUpload}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="TripLandingPage"
      component={TripLandingPage}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="SearchPage"
      component={SearchPage}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="TravelerProfile"
      component={TravelerProfile}
      options={{headerShown: false}}
    />
    <Stack.Screen name="Map" component={Map} options={{headerShown: false}} />
  </Stack.Navigator>
);

// Unauthenticated stack component
const UnauthenticatedStack = () => (
  <Stack.Navigator initialRouteName="Onboarding">
    <Stack.Screen
      name="Onboarding"
      component={OnboardingScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Login"
      component={Login}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="SignUp"
      component={SignUp}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

const App = () => {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedStack /> : <UnauthenticatedStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 18,
    textAlign: 'center',
    color: '#E7B171',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
  },
  button: {
    backgroundColor: '#3D9676',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    elevation: 5,
    flex: 1,
    marginHorizontal: 10,
  },
  registerButton: {
    backgroundColor: '#E7B171',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  swipeText: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    fontSize: 14,
    color: '#fff',
  },
});

export default () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);
