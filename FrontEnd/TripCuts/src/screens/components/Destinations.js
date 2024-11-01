import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image, ScrollView, ActivityIndicator } from 'react-native';

const Destinations = ({ tripId }) => {
  const [tripDetails, setTripDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const response = await fetch('http://192.168.100.72:4000/api/v1/getTripDetails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ trip_id: tripId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched Trip Details:', data);

        if (data.success) {
          setTripDetails(data.trip);
        } else {
          console.error('Failed to fetch trip details');
        }
      } catch (error) {
        console.error('Error fetching trip details:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  const handleDestinationPress = (media) => {
    setSelectedMedia(media);
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1B3232" />
      </View>
    );
  }

  if (!tripDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No trip details available.</Text>
      </View>
    );
  }

  const renderDestination = ({ item }) => (
    <TouchableOpacity style={styles.destinationItem} onPress={() => handleDestinationPress(item.media)}>
      <Text style={styles.destination}>{item.destinationName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tripDetails.tripName} - Destinations</Text>
      <FlatList
        data={tripDetails.destinations}
        renderItem={renderDestination}
        keyExtractor={(item) => item._id}
      />

      {/* Modal for scrolling through media */}
      <Modal visible={!!selectedMedia} animationType="slide" onRequestClose={closeMediaModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Media</Text>
          <ScrollView horizontal pagingEnabled>
            {selectedMedia && selectedMedia.map((mediaItem) => (
              <Image
                key={mediaItem._id}
                source={{ uri: mediaItem.url }}
                style={styles.mediaImage}
              />
            ))}
          </ScrollView>
          <TouchableOpacity onPress={closeMediaModal} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1B3232',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FAD8B0',
    marginBottom: 10,
  },
  destinationItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#415F5F',
    borderRadius: 8,
  },
  destination: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1B3232',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FAD8B0',
    marginBottom: 10,
  },
  mediaImage: {
    width: 300,
    height: 200,
    marginRight: 10,
    borderRadius: 8,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#333',
    alignSelf: 'center',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noDataText: {
    color: '#FAD8B0',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Destinations;
