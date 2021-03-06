// @flow
import React, {PureComponent} from 'react'
import {
  Text,
  MultiAvatar,
  Icon,
  Usernames,
  Markdown,
  Box,
  ClickableBox,
  LoadingLine,
  NativeStyleSheet,
  NativeDimensions,
  NativeFlatList,
} from '../../common-adapters/index.native'
import {globalStyles, globalColors, globalMargins} from '../../styles'
import {List} from 'immutable'
import {RowConnector} from './row'
import debounce from 'lodash/debounce'
import memoize from 'lodash/memoize'

import type {Props, RowProps} from './'

const styles = NativeStyleSheet.create({
  bottomLine: {
    color: globalColors.black_40,
    fontSize: 13,
    lineHeight: 17,
  },
})

const AddNewRow = ({onNewChat, isLoading}: {onNewChat: () => void, isLoading: boolean}) => (
  <Box style={{...globalStyles.flexBoxColumn, minHeight: 48, position: 'relative'}}>
    <ClickableBox style={{...globalStyles.flexBoxColumn, flex: 1, flexShrink: 0}} onClick={onNewChat}>
      <Box style={{...globalStyles.flexBoxRow, alignItems: 'center', justifyContent: 'center', flex: 1}}>
        <Icon type="iconfont-new" style={{color: globalColors.blue, marginRight: 9}} />
        <Text type="BodyBigLink">New chat</Text>
      </Box>
    </ClickableBox>
    {isLoading &&
      <Box style={{bottom: 0, left: 0, position: 'absolute', right: 0}}>
        <LoadingLine />
      </Box>}
  </Box>
)

// All this complexity isn't great but the current implementation of avatar forces us to juggle all these colors and
// forces us to explicitly choose undefined/the background/ etc. This can be cleaned up when avatar is simplified
function rowBorderColor(idx: number, isLastParticipant: boolean, backgroundColor: string) {
  // Only color the foreground items
  if (isLastParticipant) {
    return undefined
  }

  // We don't want a border if we're a single avatar
  return !idx && isLastParticipant ? undefined : backgroundColor
}

class Avatars
  extends PureComponent<
    void,
    {
      participants: List<string>,
      youNeedToRekey: boolean,
      participantNeedToRekey: boolean,
      isMuted: boolean,
      isSelected: boolean,
      backgroundColor: string,
    },
    void
  > {
  render() {
    const {
      participants,
      youNeedToRekey,
      participantNeedToRekey,
      isMuted,
      isSelected,
      backgroundColor,
    } = this.props

    const avatarCount = Math.min(2, participants.count())

    let icon
    if (isMuted) {
      icon = <Icon type={isSelected ? 'icon-shh-active-24' : 'icon-shh-24'} style={avatarMutedIconStyle} />
    } else if (participantNeedToRekey || youNeedToRekey) {
      icon = (
        <Icon
          type={isSelected ? 'icon-addon-lock-active-12' : 'icon-addon-lock-12'}
          style={avatarLockIconStyle}
        />
      )
    }

    const opacity = youNeedToRekey || participantNeedToRekey ? 0.4 : 1
    const avatarProps = participants
      .slice(0, 2)
      .map((username, idx) => ({
        borderColor: rowBorderColor(idx, idx === avatarCount - 1, backgroundColor),
        loadingColor: globalColors.lightGrey,
        size: 32,
        username,
        skipBackground: true,
      }))
      .toArray()

    return (
      <Box style={avatarBoxStyle(backgroundColor)}>
        <Box style={avatarInnerBoxStyle}>
          <MultiAvatar
            singleSize={40}
            multiSize={32}
            avatarProps={avatarProps}
            style={{...multiStyle(backgroundColor), opacity}}
          />
          {icon}
        </Box>
      </Box>
    )
  }
}

const multiStyle = memoize(backgroundColor => {
  return {
    alignSelf: 'center',
    backgroundColor,
  }
})

const avatarBoxStyle = memoize(backgroundColor => {
  return {
    ..._avatarBoxStyle,
    backgroundColor,
  }
})

const _avatarBoxStyle = {
  ...globalStyles.flexBoxRow,
  alignItems: 'flex-end',
  justifyContent: 'flex-start',
  maxWidth: 56,
  minWidth: 56,
  paddingLeft: globalMargins.xtiny,
}
const avatarInnerBoxStyle = {
  position: 'relative',
}

class TopLine
  extends PureComponent<
    void,
    {
      hasUnread: boolean,
      participants: List<string>,
      showBold: boolean,
      subColor: ?string,
      timestamp: ?string,
      usernameColor: ?string,
    },
    void
  > {
  render() {
    const {hasUnread, showBold, participants, subColor, timestamp, usernameColor} = this.props
    const boldOverride = showBold ? globalStyles.fontBold : null
    return (
      <Box style={{...globalStyles.flexBoxRow, alignItems: 'center', maxHeight: 19, minHeight: 19}}>
        <Box
          style={{...globalStyles.flexBoxRow, flex: 1, maxHeight: 19, minHeight: 19, position: 'relative'}}
        >
          <Box
            style={{
              ...globalStyles.flexBoxColumn,
              bottom: 0,
              justifyContent: 'flex-start',
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          >
            <Usernames
              inline={true}
              plainText={true}
              type="BodySemibold"
              containerStyle={{...boldOverride, color: usernameColor, paddingRight: 7}}
              users={participants.map(p => ({username: p})).toArray()}
              title={participants.join(', ')}
            />
          </Box>
        </Box>
        <Text type="BodySmall" style={{...boldOverride, color: subColor, lineHeight: 18}}>{timestamp}</Text>
        {hasUnread && <Box style={unreadDotStyle} />}
      </Box>
    )
  }
}

class BottomLine
  extends PureComponent<
    void,
    {
      backgroundColor: ?string,
      participantNeedToRekey: boolean,
      showBold: boolean,
      snippet: ?string,
      subColor: ?string,
      youNeedToRekey: boolean,
    },
    void
  > {
  render() {
    const {participantNeedToRekey, youNeedToRekey, showBold, subColor, snippet, backgroundColor} = this.props
    let content

    if (youNeedToRekey) {
      content = (
        <Box
          style={{
            alignSelf: 'center',
            backgroundColor: globalColors.red,
            borderRadius: 2,
            paddingLeft: globalMargins.xtiny,
            paddingRight: globalMargins.xtiny,
          }}
        >
          <Text
            type="BodySmallSemibold"
            backgroundMode="Terminal"
            style={{
              color: globalColors.white,
              fontSize: 11,
              lineHeight: 14,
            }}
          >
            REKEY NEEDED
          </Text>
        </Box>
      )
    } else if (participantNeedToRekey) {
      content = (
        <Text type="BodySmall" backgroundMode="Terminal" style={{color: subColor}}>
          Waiting for participants to rekey
        </Text>
      )
    } else if (snippet) {
      const baseStyle = styles['bottomLine']

      let style
      if (subColor !== globalColors.black_40 || showBold) {
        style = [
          {
            color: subColor,
            ...(showBold ? globalStyles.fontBold : {}),
          },
          baseStyle,
        ]
      } else {
        style = baseStyle
      }

      content = (
        <Markdown preview={true} style={style}>
          {snippet}
        </Markdown>
      )
    } else {
      return null
    }

    return (
      <Box
        style={{
          ...globalStyles.flexBoxRow,
          backgroundColor,
          flexGrow: 1,
          maxHeight: 16,
          minHeight: 16,
          position: 'relative',
        }}
      >
        <Box
          style={{
            ...globalStyles.flexBoxRow,
            alignItems: 'flex-start',
            bottom: 0,
            justifyContent: 'flex-start',
            left: 0,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        >
          {content}
        </Box>
      </Box>
    )
  }
}

class _Row extends PureComponent<void, RowProps, void> {
  render() {
    const props = this.props
    return (
      <ClickableBox
        onClick={() => props.onSelectConversation(props.conversationIDKey)}
        style={{backgroundColor: props.backgroundColor}}
      >
        <Box style={{...rowContainerStyle, backgroundColor: props.backgroundColor}}>
          <Avatars
            backgroundColor={props.backgroundColor}
            isMuted={props.isMuted}
            isSelected={props.isSelected}
            participantNeedToRekey={props.participantNeedToRekey}
            participants={props.participants}
            youNeedToRekey={props.youNeedToRekey}
          />
          <Box
            style={{
              ...conversationRowStyle,
              backgroundColor: props.backgroundColor,
            }}
          >
            <TopLine
              hasUnread={props.hasUnread}
              participants={props.participants}
              showBold={props.showBold}
              subColor={props.subColor}
              timestamp={props.timestamp}
              usernameColor={props.usernameColor}
            />
            <BottomLine
              backgroundColor={props.backgroundColor}
              participantNeedToRekey={props.participantNeedToRekey}
              showBold={props.showBold}
              snippet={props.snippet}
              subColor={props.subColor}
              youNeedToRekey={props.youNeedToRekey}
            />
          </Box>
        </Box>
      </ClickableBox>
    )
  }
}

const Row = RowConnector(_Row)

const NoChats = () => (
  <Box
    style={{
      ...globalStyles.flexBoxColumn,
      ...globalStyles.fillAbsolute,
      alignItems: 'center',
      justifyContent: 'center',
      top: 48,
    }}
  >
    <Icon type="icon-fancy-chat-103-x-75" style={{marginBottom: globalMargins.medium}} />
    <Text type="BodySmallSemibold" backgroundMode="Terminal" style={{color: globalColors.black_40}}>
      All conversations are end-to-end encrypted.
    </Text>
  </Box>
)

class Inbox extends PureComponent<void, Props, {rows: Array<any>}> {
  state = {rows: []}

  _renderItem = ({item, index}) => {
    return index
      ? <Row conversationIDKey={item} key={item} isActiveRoute={this.props.isActiveRoute} />
      : <AddNewRow onNewChat={this.props.onNewChat} isLoading={this.props.isLoading} />
  }

  _keyExtractor = (item, index) => item

  _setupDataSource = props => {
    this.setState({rows: [{}].concat(props.rows.toArray())})
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.rows !== nextProps.rows) {
      this._setupDataSource(nextProps)

      if (nextProps.rows.count()) {
        const conversationIDKey = nextProps.rows.get(0)
        this.props.onUntrustedInboxVisible(conversationIDKey, 20)
      }
    }
  }

  _askForUnboxing = (id: any, count: number) => {
    this.props.onUntrustedInboxVisible(id, count)
  }

  _onViewChanged = debounce(data => {
    if (!data) {
      return
    }
    const {viewableItems} = data
    const item = viewableItems && viewableItems[0]
    if (item && item.index) {
      this._askForUnboxing(item.item, viewableItems.length)
    }
  }, 1000)

  componentDidMount() {
    this._setupDataSource(this.props)
    if (this.props.rows.count()) {
      this._askForUnboxing(this.props.rows.first(), 30)
    }
  }

  _maxVisible = Math.ceil(NativeDimensions.get('window').height / 64)

  render() {
    return (
      <Box style={boxStyle}>
        <NativeFlatList
          loading={this.props.isLoading /* force loading to update */}
          data={this.state.rows}
          isActiveRoute={this.props.isActiveRoute}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          onViewableItemsChanged={this._onViewChanged}
          getItemLayout={(data, index) => ({length: 64, offset: 64 * index, index})}
          initialNumToRender={this._maxVisible}
          windowSize={this._maxVisible}
        />
        {!this.props.isLoading && !this.props.rows.count() && <NoChats />}
      </Box>
    )
  }
}

const boxStyle = {
  ...globalStyles.flexBoxColumn,
  backgroundColor: globalColors.white,
  flex: 1,
  position: 'relative',
}

const unreadDotStyle = {
  backgroundColor: globalColors.orange,
  borderRadius: 3,
  height: 6,
  marginLeft: 4,
  width: 6,
}

const avatarMutedIconStyle = {
  bottom: 0,
  position: 'absolute',
  right: 0,
  zIndex: 1,
}

const avatarLockIconStyle = {
  bottom: 0,
  position: 'absolute',
  right: 0,
  zIndex: 1,
}

const conversationRowStyle = {
  ...globalStyles.flexBoxColumn,
  flexGrow: 1,
  justifyContent: 'center',
  maxHeight: 64,
  minHeight: 64,
  paddingRight: 8,
}

const rowContainerStyle = {
  ...globalStyles.flexBoxRow,
  ...globalStyles.clickable,
  alignItems: 'center',
  flexGrow: 1,
  maxHeight: 64,
  minHeight: 64,
}

export default Inbox
