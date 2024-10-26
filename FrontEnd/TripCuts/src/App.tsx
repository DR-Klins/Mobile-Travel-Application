import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {View, Text, Button, StyleSheet} from 'react-native';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import Reels from './screens/Reels';
import Profile from './screens/Profile';
import CreateTrip from './screens/CreateTrip';
import Bag from './screens/Bag';
import TripLandingPage from './screens/TripLandingPage'; // Import the TripLandingPage component
import CreateTripDetails from './screens/CreateTripDetails';
import {AuthProvider, useAuth} from './screens/context/AuthContext';
import MediaUpload from './screens/MediaUpload';
import {RouteProp} from '@react-navigation/native';

// Define types for navigation
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  Reels: undefined;
  Profile: undefined;
  CreateTrip: undefined;
  Bag: undefined;
  CreateTripDetails: undefined;
  MediaUpload: {tripId: string};
  TripLandingPage: {tripId: string}; // Pass videoId to TripLandingPage
};

// Define types for the HomeScreen navigation prop
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Home'>;
};

const Stack = createStackNavigator<RootStackParamList>();

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Button title="Login" onPress={() => navigation.navigate('Login')} />
      <Button title="Signup" onPress={() => navigation.navigate('SignUp')} />
      <Button
        title="Go to Trip Landing Page"
        onPress={() =>
          navigation.navigate('TripLandingPage', {videoId: 'sample-video-id'})
        }
      />
    </View>
  );
};

// Authenticated stack component
const AuthenticatedStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Reels"
      component={Reels}
      options={{headerShown: false}} // Hide the top navigation bar
    />
    <Stack.Screen
      name="Profile"
      component={Profile}
      options={{headerShown: false}} // Hide the top navigation bar
    />
    <Stack.Screen
      name="CreateTrip"
      component={CreateTrip}
      options={{headerShown: false}} // Hide the top navigation bar
    />
    <Stack.Screen
      name="Bag"
      component={Bag}
      options={{headerShown: false}} // Hide the top navigation bar
    />
    <Stack.Screen
      name="CreateTripDetails"
      component={CreateTripDetails}
      options={{headerShown: false}} // Hide the top navigation bar
    />
    <Stack.Screen
      name="MediaUpload"
      component={MediaUpload}
      options={{headerShown: false}} // Hide the top navigation bar
    />
    <Stack.Screen
      name="TripLandingPage"
      component={TripLandingPage}
      options={{headerShown: false}} // Hide the top navigation bar
    />
  </Stack.Navigator>
);

// Unauthenticated stack component
const UnauthenticatedStack = () => (
  <Stack.Navigator initialRouteName="Home">
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="SignUp" component={SignUp} />
  </Stack.Navigator>
);

const App = () => {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);
