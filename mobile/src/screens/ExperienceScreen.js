import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button } from 'react-native';
import { API, Auth } from 'aws-amplify';

function ExperienceScreen() {
  const [experiences, setExperiences] = useState([]);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      const experiencesData = await API.get(
        'CareerHelperAPI',
        `/experiences/${currentUser.username}`
      );
      setExperiences(experiencesData);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    }
  };

  const addExperience = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      await API.post('CareerHelperAPI', '/experiences', {
        body: {
          userId: currentUser.username,
          title,
          company,
          startDate: new Date().toISOString(),
          description,
        },
      });
      setTitle('');
      setCompany('');
      setDescription('');
      fetchExperiences();
    } catch (error) {
      console.error('Error adding experience:', error);
    }
  };

  const renderExperience = ({ item }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
      <Text>{item.company}</Text>
      <Text>{item.description}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Experience Manager</Text>
      <TextInput
        placeholder="Job Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
      />
      <TextInput
        placeholder="Company"
        value={company}
        onChangeText={setCompany}
        style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
        multiline
      />
      <Button title="Add Experience" onPress={addExperience} />
      <FlatList
        data={experiences}
        renderItem={renderExperience}
        keyExtractor={item => item.experienceId}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

export default ExperienceScreen;
