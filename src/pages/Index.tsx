import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('chronel_user');
    navigate(user ? '/dashboard' : '/login', { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
