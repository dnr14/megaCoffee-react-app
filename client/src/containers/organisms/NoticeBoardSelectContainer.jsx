import * as comment from '@/api/comment';
import { selectById, deleteById } from '@/api/userNoticeBoard';
import Alert from '@/components/atoms/Alert';
import Button from '@/components/atoms/Button';
import FlexBox from '@/components/atoms/FlexBox';
import Form from '@/components/atoms/Form';
import Strong from '@/components/atoms/Strong';
import Comment from '@/components/molecules/Comment';
import CommentEditor from '@/components/molecules/CommentEditor';
import NoComments from '@/components/molecules/NoComments';
import Notice from '@/components/molecules/Notice';
import useFetch from '@/hooks/useFetch';
import { emptyCheck } from '@/utils/validations';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';

const CLOSE_TIME = 600;
const COMMENT_VALUE_MAX_LENG = 300;
const COMMENT_VALUE_REGEX = /<p>/gi;
const ALERT_CLASS_NAME_ENUM = {
  error: 'red',
  success: 'green',
};

const NoticeBoardSelectContainer = () => {
  const [post, setPost] = useState({});
  const [currentModifyCommentId, setCurrentModifyCommentId] = useState(null);
  const [comments, setComments] = useState({
    page: 0,
    totalPages: 0,
    results: [],
  });
  const [disabled, setDisabled] = useState(false);
  const [modifyDisabled, setModifyDisabled] = useState(false);
  const [commentValue, setCommentValue] = useState('');
  const [commentValueLength, setCommentValueLength] = useState(0);
  const [modifyCommentValue, setModifyCommentValue] = useState('');
  const [modifyCommentValueLength, setModifyCommentValueLength] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const { user } = useSelector(({ login }) => login);
  const [isOpen, setIsOpen] = useState(false);
  const history = useHistory();
  const param = useParams();
  const { state, callApi } = useFetch();
  const { loading, error, success } = state;
  const { page, totalPages, results } = comments;
  const { id } = user;
  const up = useRef();

  const setAlert = (text, className) => {
    setAlertOpen(true);
    setAlertMessage(
      <div className={className}>
        <span>{text}</span>
      </div>
    );
  };

  // ?????? ?????? ?????? ??????
  const commentModifyEditorClose = () => {
    if (up.current instanceof Function) up.current();
  };

  // ?????? state ?????? ??????
  const commentValueValidation = (valueLength, value) => {
    const result = value.match(COMMENT_VALUE_REGEX);
    let isDisabled = false;
    if (valueLength > COMMENT_VALUE_MAX_LENG || result?.length > 20) {
      isDisabled = true;
    }
    return isDisabled;
  };

  // ?????? ?????? ?????? state ??????
  const handleEditorOnChange = useCallback(
    (_, editor) => {
      const value = editor.getData();
      const isDisabled = commentValueValidation(commentValueLength, value);
      setDisabled(isDisabled);
      setCommentValue(value);
    },
    [commentValueLength]
  );

  // ?????? ?????? state??????
  const handleCommentModifyOnChange = useCallback(
    (_, editor) => {
      const value = editor.getData();
      const isDisabled = commentValueValidation(modifyCommentValueLength, value);
      setModifyDisabled(isDisabled);
      setModifyCommentValue(value);
    },
    [modifyCommentValueLength]
  );
  // commentEditor?????? html????????? ????????? text ?????? ????????????
  const handleEditorOnUpdate = useCallback(({ characters }) => setCommentValueLength(characters), []);

  const handleCommentModifyEditorOnUpdate = useCallback(
    ({ characters }) => setModifyCommentValueLength(characters),
    []
  );

  // ?????? ???????????? api
  const handleOnSubmit = useCallback(
    async e => {
      e.preventDefault();
      if (emptyCheck(commentValue)) {
        setAlert('????????? ??????????????????.', ALERT_CLASS_NAME_ENUM.error);
        return;
      }

      if (emptyCheck(id)) {
        setAlert('???????????? ??????????????????.', ALERT_CLASS_NAME_ENUM.error);
        return;
      }

      const obj = {
        id: param.id,
        writer: id,
        body: commentValue,
      };

      const response = await comment.insert(obj);
      const { data } = response;
      setAlert('????????? ?????????????????????.', ALERT_CLASS_NAME_ENUM.success);
      setCommentValue('');
      setComments(prev => ({
        ...prev,
        results: [data, ...prev.results],
      }));
    },
    [commentValue, param, id]
  );

  // ?????? ???????????? ?????? ??????
  const handleCommentModifyOnClick = useCallback(
    currentId => () => {
      commentModifyEditorClose();
      setTimeout(() => {
        const { body } = results.find(({ _id }) => _id === currentId);
        setModifyCommentValue(body);
        setCurrentModifyCommentId(currentId);
        setIsOpen(true);
      }, CLOSE_TIME);
    },
    [results]
  );

  // ?????? ???????????? api
  const handleCommentModify = id => () => {
    if (emptyCheck(modifyCommentValue)) {
      setAlert('????????? ??????????????????.', ALERT_CLASS_NAME_ENUM.error);
      return;
    }

    (async () => {
      try {
        const response = await comment.modifyById(id, {
          body: modifyCommentValue,
        });
        setAlert('????????? ?????????????????????.', ALERT_CLASS_NAME_ENUM.success);
        commentModifyEditorClose();
        setTimeout(() => {
          const { _id: responseId } = response.data;
          const results = comments.results.map(result => {
            const { _id } = result;
            if (responseId === _id) return response.data;
            return result;
          });
          setComments({ ...comments, results });
        }, CLOSE_TIME);
      } catch (error) {
        setAlert('???????????? ????????? ??????????????????.', ALERT_CLASS_NAME_ENUM.error);
      }
    })();
  };

  // ?????? ??? ????????????
  const handleCommentsHasMore = useCallback(async () => {
    const { page, limit, totalPages, results } = comments;
    if (page !== totalPages) {
      const { id } = param;
      const response = await comment.select(page + 1, limit, id);
      const { data } = response;
      setComments({ ...data, results: [...data.results, ...results] });
    }
  }, [comments, param]);

  // ????????? ??????
  const noticeDelete = useCallback(currentId => () => callApi(() => deleteById(currentId)), [callApi]);

  // ?????? ??????
  const commentDelete = currentId => async () => {
    try {
      await comment.deleteById(currentId);
      setAlert('????????? ?????????????????????.', ALERT_CLASS_NAME_ENUM.success);
      setComments({
        ...comments,
        results: comments.results.filter(({ _id }) => _id !== id),
      });
    } catch (error) {
      setAlert('?????? ?????? ???  ????????? ??????????????????.', ALERT_CLASS_NAME_ENUM.error);
    }
  };

  // ??? ????????? ?????? 10??? ??????
  useEffect(() => {
    (async () => {
      try {
        const { id } = param;
        // ????????? ??????
        callApi(() => selectById(id));
        const { data } = await comment.select(1, 10, id);
        setComments(data);
      } catch (error) {
        setAlert('?????? ?????? ??? ????????? ??????????????????.', ALERT_CLASS_NAME_ENUM.error);
      }
    })();
  }, [param, callApi]);

  // ??? ????????? ????????? ????????????
  useEffect(() => {
    if (success) {
      const { data } = success;
      // ????????? ??????
      if (emptyCheck(data)) {
        history.replace('/noticeBoard');
      } else {
        setPost(data);
      }
    }
  }, [success, history]);

  useEffect(() => {
    if (error) {
      setAlert('???????????? ????????? ??????????????????.', ALERT_CLASS_NAME_ENUM.error);
    }
  }, [error]);

  const notice =
    results.length === 0 ? (
      <NoComments />
    ) : (
      results.map(comment => (
        <Comment
          ref={up}
          key={comment.id}
          comment={comment}
          currentModifyCommentId={currentModifyCommentId}
          isOpen={isOpen}
          modifyCommentValue={modifyCommentValue}
          modifyDisabled={modifyDisabled}
          setIsOpen={setIsOpen}
          commentDelete={commentDelete}
          handleCommentModify={handleCommentModify}
          commentModifyEditorClose={commentModifyEditorClose}
          handleCommentModifyOnClick={handleCommentModifyOnClick}
          handleCommentModifyOnChange={handleCommentModifyOnChange}
          handleCommentModifyEditorOnUpdate={handleCommentModifyEditorOnUpdate}
        />
      ))
    );

  const commentValueMatch = commentValue.match(COMMENT_VALUE_REGEX);

  return (
    <>
      {alertOpen && (
        <Alert isOpen={alertOpen} setIsOpen={setAlertOpen} closeDelay={3000}>
          {alertMessage}
        </Alert>
      )}
      <Notice post={post} loading={loading} userInfo={user} noticeDelete={noticeDelete} />
      <div>
        <Form onSubmit={handleOnSubmit}>
          <FlexBox>
            <div>
              <span>????????????</span>
              <span>({commentValueMatch === null ? 0 : commentValueMatch.length})</span>
            </div>
            <div>
              <span>??????</span>
              <span>({commentValueLength} / 300)</span>
            </div>
            <div>
              {emptyCheck(id) ? (
                <span>
                  <Strong>(*)</Strong> ???????????? ?????? ??????????????? ???????????????.
                </span>
              ) : (
                <span>{id}</span>
              )}
            </div>
          </FlexBox>
          <CommentEditor data={commentValue} onChange={handleEditorOnChange} onUpdate={handleEditorOnUpdate} />
          <Button disabled={emptyCheck(commentValue) || disabled}>????????????</Button>
        </Form>
      </div>
      {notice}
      <div>
        <Button onClick={handleCommentsHasMore} disabled={page === totalPages}>
          ?????????
        </Button>
      </div>
    </>
  );
};

export default NoticeBoardSelectContainer;
