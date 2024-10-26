import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const Reviews = () => {
  // Sample reviews data
  const reviews = [
    { id: '1', user: 'John Doe', review: 'Amazing trip! Highly recommended.' },
    { id: '2', user: 'Jane Smith', review: 'Loved every moment of it.' },
    { id: '3', user: 'Paul White', review: 'Could have been better, but overall nice experience.' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <Text style={styles.userName}>{item.user}</Text>
      <Text>{item.review}</Text>
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
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reviewItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  userName: {
    fontWeight: 'bold',
  },
});

export default Reviews;
