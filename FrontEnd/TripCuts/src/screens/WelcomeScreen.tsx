import React, {useEffect} from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../App'; // Adjust the import according to your file structure

type WelcomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'WelcomeScreen'>;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({navigation}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Onboarding');
    }, 4000); // Adjust the duration as needed

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('./assets/logo.png')} // Replace with your logo image path
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B3232', // Set background color as needed
  },
  logo: {
    width: 400, // Adjust width as needed
    height: 400, // Adjust height as needed
  },
});

export default WelcomeScreen;
