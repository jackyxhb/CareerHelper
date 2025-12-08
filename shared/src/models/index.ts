import { initSchema, PersistentModelConstructor } from '@aws-amplify/datastore';
import { schema } from './schema';

const { Job, Experience, Application } = initSchema(schema) as {
  Job: PersistentModelConstructor<any>;
  Experience: PersistentModelConstructor<any>;
  Application: PersistentModelConstructor<any>;
};

export { schema, Job, Experience, Application };

export type JobModel = InstanceType<typeof Job>;
export type ExperienceModel = InstanceType<typeof Experience>;
export type ApplicationModel = InstanceType<typeof Application>;
