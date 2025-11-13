import './Loading.css';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
}

const Loading = ({ fullScreen = false, text = '加载中...' }: LoadingProps) => {
  const containerClass = fullScreen ? 'loading-container fullscreen' : 'loading-container';

  return (
    <div className={containerClass}>
      <div className="loading-spinner"></div>
      <div className="loading-text">{text}</div>
    </div>
  );
};

export default Loading;
