const ADVISOR_CUSTOM_TYPE = "advisor";
const FINAL_ANSWER_REMINDER = `<system-reminder reason="advisor-follow-up">
위 advisor 노트를 받아 이어 쓰는 마지막 응답은 사용자가 읽는 최종 답변이다. 사용자는 앞 답변을 다시 찾아 읽지 않는다.
- 노트를 반영해 앞 답변의 결론·근거·수치·권고가 하나라도 바뀌면 \`통합 최종본 — 앞선 답변을 대체합니다\`로 시작하고, 앞 답변에서 여전히 유효한 내용(결론, 근거, 위험·보안 경고, 사용자에게 요청한 결정, 미완료 항목, 커밋·배포 상태, 학습 기록)을 모두 다시 담은 자기완결 답변을 쓴다. 변경분만 쓰거나 "앞 답변과 같습니다"처럼 앞 답변을 가리키는 말로 내용을 생략하지 않는다.
- 바뀐 것이 없으면 앞 답변이 그대로 최종이라는 것과 반영하지 않은 이유를 한 줄로 쓴다.
</system-reminder>`;

export default function AdvisorFinalAnswer(pi)
{
    pi.setLabel?.("Advisor final answer");

    pi.on("context", event =>
    {
        const messages = event.messages;
        const lastUserIndex = messages.findLastIndex(IsUserAuthored);
        let nextMessages;

        for (let i = lastUserIndex + 1; i < messages.length; i++)
        {
            if (!IsFirstAdvisorAfterFinalAnswer(messages, i))
            {
                continue;
            }

            nextMessages ??= [...messages];
            nextMessages[i] = AppendReminder(messages[i]);
        }

        if (nextMessages === undefined)
        {
            return undefined;
        }

        return { messages: nextMessages };
    });
}

function IsUserAuthored(message)
{
    return message.role === "user" && message.synthetic !== true && message.attribution !== "agent";
}

function IsAdvisorMessage(message)
{
    return message.role === "custom" && message.customType === ADVISOR_CUSTOM_TYPE;
}

function IsFirstAdvisorAfterFinalAnswer(messages, index)
{
    if (!IsAdvisorMessage(messages[index]))
    {
        return false;
    }

    for (let i = index - 1; i >= 0; i--)
    {
        const previous = messages[i];

        if (IsAdvisorMessage(previous))
        {
            return false;
        }

        if (previous.role !== "custom")
        {
            return IsFinalAnswer(previous);
        }
    }

    return false;
}

function IsFinalAnswer(message)
{
    if (message.role !== "assistant" || !Array.isArray(message.content))
    {
        return false;
    }

    let hasText = false;

    for (const block of message.content)
    {
        if (block.type === "toolCall")
        {
            return false;
        }

        if (block.type === "text" && block.text.trim().length > 0)
        {
            hasText = true;
        }
    }

    return hasText;
}

function AppendReminder(message)
{
    if (typeof message.content === "string")
    {
        return { ...message, content: `${message.content}\n\n${FINAL_ANSWER_REMINDER}` };
    }

    return { ...message, content: [...message.content, { type: "text", text: FINAL_ANSWER_REMINDER }] };
}
