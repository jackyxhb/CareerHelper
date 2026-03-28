# Progressive Skills

This directory contains skill modules loaded on-demand by sub-agents.
Skills are NOT loaded all-at-once — only load what the current task requires.

## Loading Protocol

1. Sub-agent receives a scoped task from the supervisor
2. Sub-agent reads only the skill file(s) relevant to its role
3. Sub-agent executes using that skill's conventions
4. Sub-agent reports back; skill file is dropped from active context

## Available Skills

| Skill File | Load When |
|-----------|-----------|
| `aws-lambda.md` | Modifying Lambda function handlers or configs |
| `dynamodb.md` | Writing DynamoDB queries, GSIs, or access patterns |
| `react-patterns.md` | Building web UI components |
| `react-native-patterns.md` | Building mobile screens |
| `cdk-patterns.md` | Modifying CDK stacks or infrastructure |
| `testing-patterns.md` | Writing or fixing Jest tests |

## Adding a New Skill

Create a new `.md` file with this frontmatter:

```markdown
---
name: skill-name
description: One-line description of when to load this
load-when: [condition that triggers loading]
---

[Skill content — conventions, patterns, examples for this domain]
```
