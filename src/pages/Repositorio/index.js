import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Owner, Loading, BackButton, IssuesList, PageActions, FilterList } from './styles';
import { FaArrowLeft } from 'react-icons/fa';
import api from '../../services/api';

export default function Repositorio() {
  const { repositorio } = useParams();

  const [repo, setRepo] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const filters = [
    { state: 'all', label: 'Todas' },
    { state: 'open', label: 'Abertas' },
    { state: 'closed', label: 'Fechadas' },
  ];
  const [filterIndex, setFilterIndex] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Carrega o repositório uma única vez quando mudar o nome do repo
  useEffect(() => {
    async function loadRepo() {
      setLoading(true);
      try {
        const nomeRepo = decodeURIComponent(repositorio);
        const response = await api.get(`/repos/${nomeRepo}`);
        setRepo(response.data);
      } catch (error) {
        console.error('Erro ao carregar repositório:', error);
        setRepo(null);
      } finally {
        setLoading(false);
      }
    }

    loadRepo();
    setPage(1);       // resetar página ao mudar repo
    setFilterIndex(0); // resetar filtro ao mudar repo
  }, [repositorio]);

  // Carrega issues sempre que mudar página ou filtro, e quando o repo já estiver carregado
  useEffect(() => {
    if (!repo) return; // não carrega antes de ter repo

    async function loadIssues() {
      try {
        const nomeRepo = decodeURIComponent(repositorio);
        const response = await api.get(`/repos/${nomeRepo}/issues`, {
          params: {
            state: filters[filterIndex].state,
            page,
            per_page: 5,
          },
        });

        setIssues(response.data);
        setHasNextPage(response.data.length === 5);
      } catch (error) {
        console.error('Erro ao carregar issues:', error);
        setIssues([]);
        setHasNextPage(false);
      }
    }

    loadIssues();
  }, [page, filterIndex, repo, repositorio]);

  function handlePage(action) {
    if (action === 'back' && page > 1) {
      setPage(page - 1);
    } else if (action === 'next' && hasNextPage) {
      setPage(page + 1);
    }
  }

  function handleFilter(index) {
    setFilterIndex(index);
    setPage(1); // reset page ao trocar filtro
  }

  if (loading || !repo) {
    return (
      <Loading>
        <h1>Carregando...</h1>
      </Loading>
    );
  }

  return (
    <Container>
      <BackButton to="/">
        <FaArrowLeft color="#000" size={30} />
      </BackButton>

      <Owner>
        <img src={repo.owner?.avatar_url} alt={repo.owner?.login || 'Repositório'} />
        <h1>{repo.name}</h1>
        <p>{repo.description}</p>
      </Owner>

      <FilterList active={filterIndex}>
        {filters.map((filter, index) => (
          <button type="button" key={filter.label} onClick={() => handleFilter(index)}>
            {filter.label}
          </button>
        ))}
      </FilterList>

      <IssuesList>
        {issues.length === 0 ? (
          <p>Nenhuma issue encontrada.</p>
        ) : (
          issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />

              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>

                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>

                <p>{issue.user.login}</p>
              </div>
            </li>
          ))
        )}
      </IssuesList>

      <PageActions>
        <button type="button" onClick={() => handlePage('back')} disabled={page < 2}>
          Voltar
        </button>

        <button type="button" onClick={() => handlePage('next')} disabled={!hasNextPage}>
          Próxima
        </button>
      </PageActions>
    </Container>
  );
}
