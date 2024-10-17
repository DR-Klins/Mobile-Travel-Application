import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import axios from 'axios';
import {RootStackParamList} from '../App';
import {useAuth} from './context/AuthContext';
import {CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET} from '@env'; // Import your Cloudinary variables

interface Destination {
  destinationName: string;
  visited: boolean;
  time: string | null;
}

interface TripDetails {
  _id: string;
  tripName: string;
  tripType: string;
  budget: string;
  destinations: Destination[];
}

interface TripDetailScreenProps {
  route: {params: {tripId: string}};
}

const MediaUpload: React.FC<TripDetailScreenProps> = ({route}) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {tripId} = route.params;
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const {getUserID} = useAuth();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{
    [key: number]: {uri: string; type: string}[];
  }>({});

  useEffect(() => {
    const fetchTripDetails = async () => {
      setLoading(true);
      const user_id = await getUserID();

      try {
        const response = await axios.post(
          'http://192.168.100.38:4000/api/v1/getTrips',
          {
            user_id: user_id,
          },
        );
        const trip = response.data.trips.find(
          (t: TripDetails) => t._id === tripId,
        );
        if (trip) {
          setTripDetails(trip);
        } else {
          console.error('Trip not found');
        }
      } catch (error) {
        console.error('Error fetching trip details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, getUserID]);

  const handleExpand = (index: number) => {
    setExpandedIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const handleFinish = () => {
    Alert.alert('Success', 'Trip Published');
  };

  const selectMedia = (index: number) => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
        selectionLimit: 0, // Allows multiple selections
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.error('ImagePicker Error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const selectedMediaItems = response.assets
            .map(asset => ({
              uri: asset.uri || '',
              type: asset.type || 'image/jpeg',
            }))
            .filter(media => media.uri);

          setSelectedMedia(prev => ({
            ...prev,
            [index]: selectedMediaItems,
          }));
          console.log('Selected Media for Card:', selectedMediaItems);
        }
      },
    );
  };

  const uploadToCloudinary = async (index: number, destinationName: string) => {
    if (!selectedMedia[index] || selectedMedia[index].length === 0) {
      Alert.alert('Error', 'Please select media to upload');
      return;
    }

    // Prepare an array to store the uploaded media details
    const uploadedMediaArray = [];

    try {
      for (const media of selectedMedia[index]) {
        const formData = new FormData();
        formData.append('file', {
          uri: media.uri,
          type: media.type,
          name: `upload.${media.type === 'video/mp4' ? 'mp4' : 'jpg'}`,
        });
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'Destinations');

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        // Collect the uploaded media details
        uploadedMediaArray.push({
          public_id: response.data.public_id,
          url: response.data.url,
          resource_type: response.data.resource_type,
          format: response.data.format,
        });
      }

      // Send the batch of media to be saved in the database
      await saveMediaToDatabase(tripId, destinationName, uploadedMediaArray);
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      Alert.alert('Error', 'Failed to upload media');
    }
  };

  const saveMediaToDatabase = async (
    tripId: string,
    destinationName: string,
    mediaDataArray: {
      public_id: string;
      url: string;
      resource_type: string;
      format: string;
    }[],
  ) => {
    try {
      // Send all media as an array
      await axios.post(`http://192.168.100.38:4000/api/v1/saveMedia`, {
        tripId,
        destinationName,
        media: mediaDataArray, // Pass the array of media
      });

      Alert.alert('Success', 'Media successfully saved to the database');
    } catch (error) {
      console.error('Error saving media to database:', error);
      Alert.alert('Error', 'Failed to save media to database');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!tripDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Trip Details Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Details</Text>
      <ScrollView>
        {tripDetails.destinations.map((destination, index) => (
          <View
            key={`${destination.destinationName}-${index}`}
            style={[styles.card]}>
            <TouchableOpacity
              onPress={() => handleExpand(index)}
              style={styles.cardHeader}>
              <Text style={styles.destination}>
                {destination.destinationName}
              </Text>
            </TouchableOpacity>
            {expandedIndex === index && (
              <View style={styles.expandedContent}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mediaScroll}>
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={() => selectMedia(index)}>
                    <Text style={styles.plusSign}>+</Text>
                  </TouchableOpacity>

                  {selectedMedia[index]?.map((media, mediaIndex) => (
                    <Image
                      key={mediaIndex}
                      source={{uri: media.uri}}
                      style={styles.mediaPreview}
                    />
                  ))}
                </ScrollView>
                <View style={styles.uploadButton}>
                  <Button
                    title="Upload Media"
                    onPress={() =>
                      uploadToCloudinary(index, destination.destinationName)
                    }
                  />
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <Button title="Finish" onPress={handleFinish} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  uploadButton: {
    marginTop: 20, // Adjust the margin as needed
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destination: {
    fontSize: 18,
  },
  expandedContent: {
    marginTop: 10,
  },
  mediaScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadBox: {
    marginRight: 10,
    height: 150,
    width: 200,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  plusSign: {
    fontSize: 32,
    color: '#000',
  },
  mediaPreview: {
    marginRight: 10,
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MediaUpload;
