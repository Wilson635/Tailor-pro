// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const autoRegStub = path.resolve(__dirname, 'src/notifications/pushAutoReg.stub.js');
const topicStub = path.resolve(__dirname, 'src/notifications/topicSubscription.stub.js');

const norm = (p) => String(p || '').replace(/\\/g, '/');

const isAutoReg = (moduleName, filePath) => {
  const n = norm(moduleName);
  const f = norm(filePath);
  return n.includes('DevicePushTokenAutoRegistration.fx') || f.includes('DevicePushTokenAutoRegistration.fx');
};

const isTopicModule = (moduleName, filePath, platform) => {
  if (platform && platform !== 'android') return false;
  const n = norm(moduleName);
  const f = norm(filePath);
  return (
    n.includes('TopicSubscriptionModule') ||
    f.includes('TopicSubscriptionModule.android') ||
    /TopicSubscriptionModule\.(js|ts)$/.test(f)
  );
};

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (typeof moduleName === 'string') {
    if (isAutoReg(moduleName)) {
      return { type: 'sourceFile', filePath: autoRegStub };
    }
    if (isTopicModule(moduleName, '', platform)) {
      return { type: 'sourceFile', filePath: topicStub };
    }
  }

  const resolved = defaultResolve
    ? defaultResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);

  if (resolved?.type === 'sourceFile' && resolved.filePath) {
    if (isAutoReg('', resolved.filePath)) {
      return { type: 'sourceFile', filePath: autoRegStub };
    }
    if (isTopicModule('', resolved.filePath, platform)) {
      return { type: 'sourceFile', filePath: topicStub };
    }
  }
  return resolved;
};

module.exports = config;
