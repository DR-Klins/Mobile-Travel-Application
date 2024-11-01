import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
} from 'react-native';
import * as Yup from 'yup';
import {Formik} from 'formik';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from './context/AuthContext';

// Define form values type
interface FormValues {
  email: string;
  password: string;
}

// Validation schema
const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

// Handle submit function
const handleSubmit = async (
  values: FormValues,
  {
    login,
    navigation,
  }: {login: (token: string, id: string) => void; navigation: any},
) => {
  try {
    const response = await fetch('http://192.168.100.72:4000/api/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! Status: ${response.status}`,
      );
    }

    const data = await response.json();
    login(data.token, data.user._id); // Use the login function from context
    console.log('Response:', data);
    navigation.navigate('Reels'); // Navigate to Reels on successful login
  } catch (error) {
    console.error('Error:', error);
    // Show error to the user if needed
  }
};

const Login = () => {
  const navigation = useNavigation();
  const {login} = useAuth(); // Use the login function from context

  return (
    <ImageBackground
      source={require('./assets/travel1.jpg')} // Add your background image here
      style={styles.background}>
      <SafeAreaView style={styles.appContainer}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Formik
            initialValues={{email: '', password: ''}}
            onSubmit={values => handleSubmit(values, {login, navigation})} // Pass context login and navigation
            validationSchema={validationSchema}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              resetForm,
            }) => (
              <>
                <View style={styles.inputWrapper}>
                  <Text style={styles.heading}>Email:</Text>
                  <TextInput
                    style={styles.inputStyle}
                    placeholder="Ex. johndoe@example.com"
                    placeholderTextColor="#aaa"
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    value={values.email}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={styles.heading}>Password:</Text>
                  <TextInput
                    style={styles.inputStyle}
                    placeholder="••••••••"
                    placeholderTextColor="#aaa"
                    secureTextEntry
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => handleSubmit()}>
                    <Text style={styles.primaryBtnTxt}>Login</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => resetForm()}>
                    <Text style={styles.secondaryBtnTxt}>Reset</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.link}>
                  <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.link}>
                  <Text style={styles.linkText}>
                    Don't have an account? Sign Up
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Black transparent background
    elevation: 10, // Shadow effect for depth
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginTop: 100, // Added margin to bring the box down
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E7B171', // White text for contrast
    marginBottom: 20,
    textAlign: 'center',
  },
  heading: {
    fontSize: 16,
    color: '#E7B171', // White text for contrast
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputStyle: {
    padding: 12,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: '#1B3232',
    backgroundColor: '#415F5F', // Light background for input
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ff0d10',
    marginTop: 5,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  primaryBtn: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#1B3232',
    alignItems: 'center',
    shadowColor: '#FAD8B0',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  primaryBtnTxt: {
    color: '#FAD8B0',
    fontWeight: 'bold',
  },
  secondaryBtn: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FAD8B0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  secondaryBtnTxt: {
    color: '#16213e',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#FAD8B0',
    textDecorationLine: 'underline',
  },
});

export default Login;
