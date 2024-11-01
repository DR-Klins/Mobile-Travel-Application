import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const Reviews = () => {
  const reviews = [
    { id: '1', user: 'John Doe', review: 'Amazing trip! Highly recommended.' },
    { id: '2', user: 'Jane Smith', review: 'Loved every moment of it.' },
    { id: '3', user: 'Paul White', review: 'Could have been better, but overall nice experience.' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <Text style={styles.userName}>{item.user}</Text>
      <Text style={styles.reviewText}>{item.review}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reviews</Text>
      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B3232',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FAD8B0',
    marginBottom: 12,
  },
  reviewItem: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#3D9676',
    borderRadius: 10,
  },
  userName: {
    fontWeight: 'bold',
    color: '#FAD8B0',
    fontSize: 16,
    marginBottom: 4,
  },
  reviewText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default Reviews;
