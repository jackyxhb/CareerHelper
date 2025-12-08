import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button } from 'react-native';
import { Auth } from 'aws-amplify';
import { DataStore } from '@aws-amplify/datastore';
import { Experience } from 'careerhelper-shared';
import {
  createLocalExperience,
  syncExperiencesFromApi,
} from '../services/dataSync';
import SyncStatusBanner from '../components/SyncStatusBanner';
import { logError, logInfo } from '../utils/logger';

function ExperienceScreen() {
  const [experiences, setExperiences] = useState([]);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [userId, setUserId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let subscription;
    let mounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = await Auth.currentAuthenticatedUser();
        if (!mounted) {
          return;
        }
        setUserId(currentUser.username);

        subscription = DataStore.observeQuery(Experience, exp =>
          exp.userId('eq', currentUser.username)
        ).subscribe(snapshot => {
          if (mounted) {
            setExperiences(snapshot.items);
          }
        });

        await syncExperiencesFromApi(currentUser.username);
      } catch (error) {
        logError('Failed to bootstrap experiences', error);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const addExperience = async () => {
    if (!userId) {
      return;
    }

    setFeedback(null);
    try {
      await createLocalExperience(userId, {
        title,
        company,
        startDate: new Date().toISOString(),
        description,
      });
      setTitle('');
      setCompany('');
      setDescription('');
      setFeedback('Saved locally. We will sync it when online.');
      logInfo('Experience queued locally for sync');
    } catch (error) {
      logError('Failed to add experience', error, {
        title,
        company,
      });
      setFeedback('Could not save at the moment. Please try again later.');
    }
  };

  const renderExperience = ({ item }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
      <Text>{item.company}</Text>
      <Text>{item.description}</Text>
      {item.pendingSync && (
        <Text style={{ color: '#b45309' }}>Waiting to sync…</Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <SyncStatusBanner />
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Experience Manager</Text>
      {feedback && <Text style={{ marginBottom: 10 }}>{feedback}</Text>}
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
