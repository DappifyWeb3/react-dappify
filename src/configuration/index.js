import Project from '../model/Project';
import isEmpty from 'lodash/isEmpty';

const setDocumentMetadata = (config) => {
    if (isEmpty(config)) return;
    document.title = config.name;
    const meta = document.getElementsByTagName('meta');
    meta.namedItem('description').setAttribute('content', config.description);
    meta.namedItem('author').setAttribute('content', config.name);
    const link = document.getElementsByTagName('link');
    link.namedItem('icon')?.setAttribute('href', config.icon);
};

export const loadConfiguration = async () => {
    const project = await Project.getInstance();
    const targetConfig = project.config
    setDocumentMetadata(targetConfig);
    return targetConfig;
};
