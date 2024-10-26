import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';

const Itinerary = ({ tripId }) => {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const response = await fetch('http://192.168.100.72:4000/api/v1/getItinerary', {
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
        console.log('Fetched Itinerary:', data);

        if (data.success) {
          setItinerary(data.itinerary);
        } else {
          console.error('Failed to fetch itinerary: No data returned');
        }
      } catch (error) {
        console.error('Error fetching itinerary:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [tripId]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!itinerary) {
    return (
      <View style={styles.container}>
        <Text>No itinerary data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {itinerary.q1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Complete Plan</Text>
          <Text style={styles.item}>{itinerary.q1}</Text>
        </View>
      )}
      {itinerary.q2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transport Options</Text>
          <Text style={styles.item}>{itinerary.q2}</Text>
        </View>
      )}
      {itinerary.q3 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Best Time to Visit</Text>
          <Text style={styles.item}>{itinerary.q3}</Text>
        </View>
      )}
      {itinerary.q4 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Safety Tips</Text>
          <Text style={styles.item}>{itinerary.q4}</Text>
        </View>
      )}
      {itinerary.q5 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency and Useful Contacts</Text>
          <Text style={styles.item}>{itinerary.q5}</Text>
        </View>
      )}
      {itinerary.q6 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Approx. Walking Distance</Text>
          <Text style={styles.item}>{itinerary.q6}</Text>
        </View>
      )}
      {itinerary.q7 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Language Tips</Text>
          <Text style={styles.item}>{itinerary.q7}</Text>
        </View>
      )}
      {itinerary.q8 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Favorite Visited Place</Text>
          <Text style={styles.item}>{itinerary.q8}</Text>
        </View>
      )}
      {itinerary.q9 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          <Text style={styles.item}>{itinerary.q9}</Text>
        </View>
      )}
    </ScrollView>
  );
};

// Define PropTypes for the component
Itinerary.propTypes = {
  tripId: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 15,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  item: {
    marginBottom: 4,
  },
});

export default Itinerary;
