import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet} from 'react-native';
import TravelCardScreen from './components/TripCards';
const Tab = createBottomTabNavigator();

const CreatedTrips = () => (
  <TravelCardScreen /> // Replace the existing content with the TravelCardScreen
);

const UpcomingTrips = () => (
  <View style={styles.container}>
    <Text>Upcoming Trips</Text>
  </View>
);

const CompletedTrips = () => (
  <View style={styles.container}>
    <Text>Completed Trips</Text>
  </View>
);

const TripsTabScreen = () => {
  return (
    <Tab.Navigator
      initialRouteName="UpcomingTrips"
      screenOptions={({route}) => ({
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'black',
        tabBarActiveBackgroundColor: '#FAD8B0', // Highlight the active tab
        tabBarInactiveBackgroundColor: '#FAD8B0', // Inactive tab background
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
      <Tab.Screen
        name="CreatedTrips"
        component={CreatedTrips}
        options={{tabBarLabel: 'Created Trips'}}
      />
      <Tab.Screen
        name="UpcomingTrips"
        component={UpcomingTrips}
        options={{tabBarLabel: 'Upcoming Trips'}}
      />
      <Tab.Screen
        name="CompletedTrips"
        component={CompletedTrips}
        options={{tabBarLabel: 'Completed Trips'}}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B3232',
  },
});

export default TripsTabScreen;
